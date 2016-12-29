'use strict';
const bcrypt = require('bcrypt');
const boom = require('boom');
const config = require('../config');
const crypto = require('crypto');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const ms = require('ms');
const uuid = require('uuid');

const REFRESH_EXPIRY = ms(config.get('auth.jwt.refreshExpiresIn'));

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
      isHttpOnly: false
    });

    server.state('refresh', {
      path: '/',
      isSecure: cookiesAreSecure,
      isHttpOnly: false
    });

    server.register(require('hapi-auth-jwt2'), function (err) {
      if (err) {
        return console.log('Error registering hapi-auth-jwt2', err);
      }

      const jwtConfig = config.get('auth.jwt');
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
              // TODO: check i've remember cookie header right... (i don't think i have!)
              request.response.header('set-cookie', `token=${token}; Path=/; HttpOnly=false; IsSecure=${cookiesAreSecure}`);
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
                    // hence we don't need to wait for the promse to resolve now
                    request.plugins['api-auth'] = request.plugins['api-auth'] || {};
                    request.plugins['api-auth'].newAccessToken = createAccessToken(refreshToken);
                    return callback(null, true);
                  } else {
                    request.plugins['api-auth'] = request.plugins['api-auth'] || {};
                    // TODO: This doesn't work as the responseFunc isn't called. Prob need
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

      function authorizeUser(db, userId, displayName) {
        // This generates the tokens and stores the refresh token in couch

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
          const sha256 = crypto.createHash('sha256');
          sha256.update(tokens.bytes);
          return db.insertAsync({
            _id: sha256.digest('hex') + '-refresh',
            type: 'refresh-token',
            userId,
            displayName,
            created: Date.now() / 1000  // `created` should be treated like `exp` in the JWT, i.e.
                                        // i.e. use seconds-since-epoch, not milliseconds-since-epoch
          }).then(() => {
            return { accessToken: tokens.token, refreshToken };
          });
        });
      }

      server.route({
        method: ['GET', 'POST'],
        path: '/api/auth/github',
        config: {
          auth: { strategies: ['jwt', 'github'] },
          handler: function (request, reply) {
            if (!request.auth.isAuthenticated) {
              return reply.redirect('/login?failed'); // TODO: This should probably be a nicer place, with a redirect location etc
            }

            return getEmailDoc(server.app.db, request.auth.credentials.profile.email)
              .then(emailDoc => {

                return authorizeUser(server.app.db, emailDoc.userId, request.auth.credentials.profile.displayName);
              })
              .catch(e => {
                if (e.statusCode === 404) {
                  const { email, displayName, username } = request.auth.credentials.profile;
                  const userId = uuid();

                  return server.app.db.insertAsync({
                    _id: email + '-email',
                    userId,
                    type: 'user-email',
                    authType: 'github'
                  }).then(() => {
                    return server.app.db.insertAsync({
                      _id: userId,
                      type: 'user',
                      state: 'await-approval',
                      displayName,
                      email,
                      github: { username }
                    });
                  }).then(() => {
                    return reply.redirect('/auth/awaiting-approval');
                  });
                }

                throw boom.unauthorized();
              })
              .then(result => {
                if (result.accessToken) {

                  const response = reply.redirect('/loggedin');
                  response.state('token', result.accessToken);
                  response.state('refresh', result.refreshToken);
                  return response;
                }
                throw boom.unauthorized();
              })
              .catch(e => {
                if (e.isBoom) {
                  return reply(e);
                }
                console.log('Internal error - github auth', e);
                return reply(boom.internal());
              });
          }
        }
      });



      server.route({
        method: 'POST',
        path: '/api/auth/signin',
        config: {
          validate: {
            payload: {
              email: joi.string().required(),
              password: joi.string().required()
            }
          },
          handler: function (request, reply) {
            return getEmailDoc(server.app.db, request.payload.email)
              .then(emailDoc => {

                if (emailDoc.authType === 'password') {
                  return validateCredentials(server.app.db, emailDoc, request.payload.email, request.payload.password);
                }

                throw new boom.unauthorized();
              })
              .then(user => {
                return authorizeUser(server.app.db, user.userId, user.displayName);
              })
              .then(result => {
                // TODO: This could be extracted
                if (result.accessToken) {

                  const response = reply.redirect('/loggedin');
                  response.state('token', result.accessToken);
                  response.state('refresh', result.refreshToken);
                  return response;
                }
                throw boom.unauthorized();
              })
              .catch(e => {
                if (e.isBoom) {
                  return reply(e);
                }
                return boom.unauthorized();
              });
          }
        }
      });

      server.route({
        method: 'GET',
        path: '/api/auth/check',
        config: {
          auth: 'jwt',
          handler: function (request, reply) {
            return reply({ success: true });
          }
        }
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
 * @param userId
 * @param displayName
 * @returns {Promise} {String} token
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

function getEmailDoc(db, email) {
  return db.getAsync(email + '-email');
}

const validateCredentials = function (db, emailDoc, email, password) {
  return new Promise((resolve, reject) => {

    if (emailDoc.authType === 'password') {
      let hash;

      if (emailDoc.accountLocked > Date.now() - ms('1m')) {
        return reject(boom.unauthorized('ACCOUNT_LOCKED'))
      }

      switch(emailDoc.algorithm) {
        case 'sha1-bcrypt': // These were migrated from the old system, so are bcrypted sha1 hex hashes
          hash = crypto.createHash('sha1');
          hash.update(password);

          bcrypt.compare(hash.digest('hex'), emailDoc.password, function (err, res) {
            if (res) {
              if (emailDoc.failedLogins || emailDoc.accountLocked) {
                delete emailDoc.failedLogins;
                delete emailDoc.accountLocked;
                db.insertAsync(emailDoc)
              }
              return resolve({ userId: emailDoc.userId, displayName: 'TODO' });
            }

            emailDoc.failedLogins = (emailDoc.failedLogins || 0) + 1;
            if (emailDoc.accountLocked) {
              delete emailDoc.accountLocked;
            }
            if (emailDoc.failedLogins >= 6) {
              emailDoc.accountLocked = Date.now();
              emailDoc.failedLogins = 0; // Reset the failed logins for the next count
            }

            db.insertAsync(emailDoc).then(() => reject(boom.unauthorized()));
          });
      }
    }
  });
};
