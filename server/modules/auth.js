'use strict';

/**
 * This is possibly over-engineered authentication system for what it is initially designed for
 * However, this is done for two reasons:
 *  1. Security should always be done "to the best of my ability"
 *  2. I'd like to extract this whole module to a standalone hapi plugin, where you
 *     just need to configure a storage module (could also be included for some standard
 *     storage mechanisms), and some parameters on what you'd like to accept, and you get
 *     authentication and authorization, complete with signup, failed logins, locked accounts,
 *     forgot password, `bell` integration etc.
 *     I feel like I write similar code every time I need to do this.
 */


const bcrypt = require('bcrypt');
const boom = require('boom');
const config = require('../config');
const crypto = require('crypto');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const ms = require('ms');
const uuid = require('uuid');

const REFRESH_EXPIRY = ms(config.get('auth.jwt.refreshExpiresIn'));

class InvalidCredentialsError extends Error {}
class AccountLockedError extends Error {}

const register = module.exports = function register(server, options, next) {


  server.register(require('bell'), function (err) {

    if (err) {
      console.log('Error registering bell', err);
      return;
    }

    const github = config.get('auth.github');
    server.auth.strategy('github', 'bell', {
      provider: 'github',
      password: github.encryptionPassword,
      clientId: github.clientId,
      clientSecret: github.clientSecret,
      isSecure: github.isSecure
    });

    const cookiesAreSecure = config.get('auth.jwt.isSecure');
    server.state('token', {
      path: '/',
      isSecure: cookiesAreSecure,
      isHttpOnly: false,
      strictHeader: false
    });

    server.state('refresh', {
      path: '/',
      isSecure: cookiesAreSecure,
      isHttpOnly: false,
      strictHeader: false
    });

    server.register(require('hapi-auth-jwt2'), function (err) {
      if (err) {
        return console.log('Error registering hapi-auth-jwt2', err);
      }

      const jwtConfig = config.get('auth.jwt');
      // When this is extracted to its own plugin, we may drop the jwt auth scheme,
      // and just use our own with the jsonwebtoken validation.
      server.auth.strategy('jwt', 'jwt', {
        key: jwtConfig.secret,
        urlKey: false,
        cookieKey: false,
        responseFunc: function (request, reply) {
          const pluginState = request.plugins['api-auth'];
          if (pluginState && pluginState.newAccessToken) {
            pluginState.newAccessToken.then(token => {
              // TODO: request.response.state doesn't seem to work here...
              // I think it should. We should make a tiny repro case for this
              // request.response.state('token', token);
              request.response.header('set-cookie', `token=${token}; Path=/; ${cookiesAreSecure ? 'Secure' : ''}`);
              reply.continue();
            });
          } else {
            reply.continue();
          }
        },
        validateFunc: function (decoded, request, callback) {
          if (decoded.iss !== jwtConfig.issuer) {
            return callback(null, false);
          }
          if (decoded.exp <= (Date.now() / 1000)) {

            if (request.headers['x-refresh-token']) {
              return getRefreshToken(server.app.db, request.headers['x-refresh-token'])
                .then(refreshToken => {
                  if (refreshToken.valid) {
                    // Assign the new token promise to a plugin attribute
                    // We'll check this when the response goes out, and add the updated cookie
                    // hence we don't need to wait for the promise to resolve now
                    request.plugins['api-auth'] = request.plugins['api-auth'] || {};
                    request.plugins['api-auth'].newAccessToken = createAccessToken(refreshToken);
                    return callback(null, true);
                  } else {
                    request.plugins['api-auth'] = request.plugins['api-auth'] || {};
                    // TODO: This doesn't work as the responseFunc isn't called. Prob need a preResponseHandler or something
                    request.plugins['api-auth'].clearTokens = true;
                  }
                  return callback(null, false);
                });

            }
            return callback(null, false);
          }
          callback(null, true);
        },
        verifyOptions: {
          ignoreExpiration: true,
          algorithms: [ jwtConfig.get('algorithm') ],
        },
      });

      server.route({
        method: ['GET', 'POST'],
        path: '/api/auth/github',
        config: {
          auth: { strategy: 'github', scope: false },
          handler: function (request, reply) {
            if (!request.auth.isAuthenticated) {
              return reply.redirect('/login?failed'); // TODO: This should probably be a nicer place, with a redirect location etc
            }

            return getEmailDoc(server.app.db, request.auth.credentials.profile.email)
              .catch(e => {
                if (e.statusCode === 404) {
                  const { email, displayName, username } = request.auth.credentials.profile;
                  return createUser(server.app.db, { email, displayName, username, authType: 'github' })
                    .then(() => reply.redirect('/auth/awaiting-approval'));
                }
                throw boom.unauthorized();
              })
              .then(emailDoc => getUserDoc(server.app.db, emailDoc))
              .then(({ emailDoc, userDoc }) => authorizeScope(emailDoc, userDoc))
              .then(({ emailDoc, userDoc }) => createAuthTokens(server.app.db, {
                userId: emailDoc.userId,
                displayName: request.auth.credentials.profile.displayName,
                scope: userDoc.scope
              }))
              .then(tokens => createResponse(reply, tokens))
              .catch(e => {
                if (e.isBoom) {
                  return reply(e);
                }
                return reply(boom.internal());
              });
          }
        }
      });

      server.route({
        method: 'POST',
        path: '/api/auth/signin',
        config: {
          auth: false,
          validate: {
            payload: {
              email: joi.string().required(),
              password: joi.string().required()
            }
          },
          handler: function (request, reply) {
            getEmailDoc(server.app.db, request.payload.email)
              .then(emailDoc => acceptOnlyAuthTypes(emailDoc, 'password'))
              .then(emailDoc =>
                  authenticateWithPassword(server.app.db, emailDoc, request.payload.email, request.payload.password)
              )
              .then(emailDoc => getUserDoc(server.app.db, emailDoc))
              .then(({ emailDoc, userDoc }) => authorizeScope(emailDoc, userDoc))
              .then(({ emailDoc, userDoc }) => createAuthTokens(server.app.db, {
                userId: emailDoc.userId,
                displayName: userDoc.displayName,
                scope: userDoc.scope
              }))
              .then(tokens => createResponse(reply, tokens))
              .catch(e => mapErrors(e))
              .catch(e => {
                if (e.isBoom) {
                  // TODO: Random response time on failure to avoid timing hacks
                  // Don't know how to do this in tests with fake timers
                  // Need parts of the promise to complete before ticking the timer forward
                  // for the setTimeout on the reply
                  // Could actually add a separate plugin for random delays for 401 response times
                  return reply(e);
                }
                reply(boom.internal())
              });
          }
        }
      });

      server.route({
        method: 'POST',
        path: '/api/auth/signup',
        config: {
          auth: false,
          validate: {
            payload: {
              email: joi.string().required(),
              password: joi.string().required(),
              displayName: joi.string()
            }
          },
          handler(request, reply) {
            return createBcryptHash(request.payload.password)
              .then(hash => createUser(server.app.db, {
                email: request.payload.email,
                displayName: request.payload.displayName,
                authType: 'password',
                algorithm: 'bcrypt',
                password: hash
              }))
              .catch(e => {
                if (e.statusCode === 409) {
                  // TODO: send user email to notify of repeated sign-up attempt
                  // This should be just an event emitted
                  return;
                }
                throw boom.unauthorized();
              })
              .then(() => reply({ success: true }))
              .catch(e => {
                if (e.isBoom) {
                  return reply(e);
                }
                return reply(boom.internal());
              });
          }
        }
      });

      server.route({
        method: 'POST',
        path: '/api/auth/approve',
        config: {
          auth: {
            strategy: 'jwt',
            scope: 'admin'
          },
          validate: {
            query: {
              email: joi.string().required()
            }
          },
          handler(request, reply) {
            return server.app.db.getAsync(request.query.email + '-email')
              .then(emailDoc => {
                emailDoc.scope = emailDoc.scope || [];
                if (emailDoc.scope.indexOf('login') === -1 && emailDoc.scope.indexOf('rejected') === -1) {
                  emailDoc.scope.push('login');
                  return server.app.db.insertAsync(emailDoc);
                }
              }).then(() => reply({ success: true }));
          }
        }
      });

      server.route({
        method: 'GET',
        path: '/api/auth',
        config: {
          auth: {
            strategy: 'jwt',
            scope: false
          },
          handler: function (request, reply) {

            const { displayName, scope } = request.auth.credentials;
            return reply({ displayName, scope });
          }
        }
      });

      server.auth.default({
        strategy: 'jwt',
        scope: 'login'
      });
      next();

    });
  });
};


register.attributes = {
  pkg: {
    name: 'api-auth',
    version: '1.0.0'
  }
};


function refreshTokenNotExpired(token) {
  return (token.created * 1000 + REFRESH_EXPIRY) > Date.now();
}

function hashRefreshToken(token) {
  const sha256 = crypto.createHash('sha256');
  sha256.update(token);
  return sha256.digest('hex');
}

/**
 * Gets a refresh token from the database
 * Returned value contains a `.valid` property, which is true if the token has not expired
 * @param db
 * @param token
 * @returns {Promise.<Token>} Token containing `userId`, `displayName`
 */
function getRefreshToken(db, token) {

  return db.getAsync(hashRefreshToken(token) + '-refresh')
    .then(token => {
      token.valid = refreshTokenNotExpired(token);
      return token;
    })
    .catch(error => {
      if (error.statusCode === 404) {
        return { valid: false };
      }
      throw error;
    });

}

/**
 * Creates an access token
 * @param {object} options
 * @param {string} options.userId
 * @param {string} options.displayName
 * @returns {Promise<string>} token
 */
function createAccessToken({ userId, displayName }) {
  const jwtConfig = config.get('auth.jwt');
  return new Promise((resolve, reject) => {
    jwt.sign({ displayName }, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      subject: userId,
      expiresIn: jwtConfig.accessExpiresIn
    }, (err, token) => {

      if (err) {
        return reject(err);
      }
      return resolve(token);
    });
  });
}

const getEmailDoc = function (db, email) {
  return db.getAsync(email + '-email');
};

const getUserDoc = function (db, emailDoc) {
  return db.getAsync(emailDoc.userId)
    .then(userDoc => ({ emailDoc, userDoc }))
};

const authorizeScope = function (emailDoc, userDoc) {
  if (userDoc.scope && userDoc.scope.indexOf('login') !== -1) {
    return { emailDoc, userDoc };
  }
  throw boom.unauthorized();
};

const authenticateWithPassword = function (db, emailDoc, email, password) {

  if (emailDoc.accountLocked > Date.now() - ms('1m')) {
    return Promise.reject(new AccountLockedError());
  }

  return validateCredentials(emailDoc, password)
    .catch(e => {
      emailDoc.failedLogins = (emailDoc.failedLogins || 0) + 1;
      if (emailDoc.accountLocked) {
        delete emailDoc.accountLocked;
      }
      if (emailDoc.failedLogins >= 6) {
        emailDoc.accountLocked = Date.now();
        emailDoc.failedLogins = 0; // Reset the failed logins for the next count
      }

      return db.insertAsync(emailDoc)
        .then(() => Promise.reject(new InvalidCredentialsError()));
    })
    .then(() => {
      if (emailDoc.failedLogins || emailDoc.accountLocked) {
        delete emailDoc.failedLogins;
        delete emailDoc.accountLocked;
        return db.insertAsync(emailDoc);
      }
    })
    .then(() => emailDoc)
};

const validateCredentials = function (emailDoc, password) {
  let hash;
  return new Promise((resolve, reject) => {
    switch (emailDoc.algorithm) {
      case 'sha1-bcrypt': // These were migrated from the old system, so are bcrypted sha1 hex hashes
        hash = crypto.createHash('sha1');
        hash.update(password);

        bcrypt.compare(hash.digest('hex'), emailDoc.password, function (err, res) {
          if (res) {
            return resolve(res);
          }
          reject();
        });
        break;

      case 'bcrypt':
        bcrypt.compare(password, emailDoc.password, function (err, res) {
          if (res) {
            return resolve(res);
          }
          reject();
        });
        break;
    }
  });
};

const createBcryptHash = function (password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, function (err, hash) {
      if (err) {
        return reject(err);
      }
      resolve(hash);
    });
  });
};

const createUser = function (db, userOptions) {

  const userId = uuid();

  const emailDoc = {
    _id: userOptions.email + '-email',
    userId,
    type: 'user-email',
    authType: userOptions.authType
  };

  if (userOptions.authType === 'password') {
    emailDoc.algorithm = userOptions.algorithm;
    emailDoc.password = userOptions.password;
  }

  const userDoc = {
    _id: userId,
    type: 'user',
    displayName: userOptions.displayName,
    email: userOptions.email,
    scope: []
  };

  if (userOptions.github) {
    userDoc.github = userOptions.github;
  }

  return db.insertAsync(emailDoc)
    .then(() => db.insertAsync(userDoc));
};

function createAuthTokens(db, { userId, displayName, scope }) {

        const jwtConfig = config.get('auth.jwt');
        return new Promise((resolve, reject) => {
          jwt.sign({ displayName, scope }, jwtConfig.secret, {
            issuer: jwtConfig.issuer,
            subject: userId,
            expiresIn: jwtConfig.accessExpiresIn
          }, (err, token) => {

            if (err) {
              return reject(err);
            }
            return resolve(token);
          });
        }).then(token => {
          return new Promise((resolve, reject) => {
            crypto.randomBytes(64, (err, buf) => {
              if (err) {
                return reject(err);
              }
              resolve(buf);
            });
          }).then(buf => {
            return { token, bytes: buf };
          });
        }).then(tokens => {
          const refreshToken = tokens.bytes.toString('hex');
          return db.insertAsync({
            _id: hashRefreshToken(refreshToken) + '-refresh',
            type: 'refresh-token',
            userId,
            displayName,
            scope: scope,
            created: Date.now() / 1000  // `created` should be treated like `exp` in the JWT, i.e.
                                        // i.e. use seconds-since-epoch, not milliseconds-since-epoch
          }).then(() => {
            return { accessToken: tokens.token, refreshToken };
          });
        });
      }

const createResponse = function (reply, { accessToken, refreshToken }) {
  if (accessToken) {

    const response = reply({ success: true });
    response.state('token', accessToken);
    response.state('refresh', refreshToken);
    return response;
  }
  throw boom.unauthorized();
};

const mapErrors = function (error) {
  if (error instanceof AccountLockedError) {
    throw boom.unauthorized('ACCOUNT_LOCKED');
  }
  if (error instanceof InvalidCredentialsError) {
    throw boom.unauthorized();
  }
  throw error;
};

const acceptOnlyAuthTypes = function (emailDoc, authTypes) {
  if (emailDoc.authType === authTypes ||
    Array.isArray(authTypes) && authTypes.some(authType => emailDoc.authType === authType)) {
    return emailDoc;
  }
  throw boom.unauthorized();
}


