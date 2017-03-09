process.env.NODE_ENV = 'unittest';
const auth = require('../modules/auth');
const Bell = require('bell');
const config = require('../config');
const crypto = require('crypto');
const Hapi = require('hapi');
const ms = require('ms');
const sinon = require('sinon');
const unexpected = require('unexpected');

const expect = unexpected
  .clone()
  .use(require('unexpected-sinon'))
  .use(require('unexpected-mitm'))
  .use(require('./to-yield-exchange-assertion'));

const REFRESH_EXPIRY = ms(config.get('auth.jwt.refreshExpiresIn'));
const ACCESS_EXPIRY = ms(config.get('auth.jwt.accessExpiresIn'));

const BIG_S3CRET_BCRYPT = '$2a$10$xiGStaPTxwZwE2URau3T6uIr.VsCzhsIY7d2C3rwQanLHtcSzfJy6';
const BIG_S3CRET_SHA1_BCRYPT = '$2a$10$xDbzy5Lwao46p3ygGxZahuaidVvDH.6fYkJFSc46qPL0HZzaaIufa'; // sha1-bcrypt of 'bigS3cret'

expect.addAssertion('<object> [not] to contain the authorization headers', function (expect, subject) {
  let cookieHeaders = subject.headers && subject.headers['set-cookie'];
  if (!Array.isArray(cookieHeaders)) {
    cookieHeaders = [ cookieHeaders ];
  }

  let tokenHeader = null;
  let refreshHeader = null;
  if (cookieHeaders && cookieHeaders.length > 1) {
    tokenHeader = cookieHeaders.filter(header => /^token=/.test(header));
    refreshHeader = cookieHeaders.filter(header => /^refresh=/.test(header));
  }

  if (this.flags.not) {
    if (tokenHeader || refreshHeader) {
      expect.errorMode = 'nested';
      expect.fail({
        message: function (output) {
          return output.error('There were \'set-cookie\' headers in the response with tokens');
        }
      });
    }
    // For `not`, we only have one check
    return;
  }

  if (!cookieHeaders) {
    expect.errorMode = 'nested';
    expect.fail({
      message: function (output) {
        return output.error('There were no \'set-cookie\' headers in the response');
      }
    });
  }

  if (!tokenHeader) {
    expect.errorMode = 'bubble';
    expect.fail({
      message: function (output) {
        return output.error('expected ').append(expect.inspect(cookieHeaders)).error(' to contain the ').cyan('token').error(' cookie');
      }
    });
  }

  if (!refreshHeader) {
    expect.errorMode = 'bubble';
    expect.fail({
      message: function (output) {
        return output.error('expected ').append(expect.inspect(cookieHeaders)).error(' to contain the ').cyan('refresh').error(' cookie');
      }
    });
  }
});

describe('auth module', function () {

  let server, inject;
  let credentialsFunc;
  let clock;
  const mockDb = {};
  beforeEach(function () {

    server = new Hapi.Server();
    server.connection({ port: 5000 });

    credentialsFunc = null;

    Bell.simulate((request, next) => {
      if (credentialsFunc) {
        return credentialsFunc(request, next);
      }
      next(null, { profile: { email: 'test@foo.com', displayName: 'Mrs Unit Test', username: 'foouser' } });
    });

    clock = sinon.useFakeTimers(new Date(2016, 1, 1).getTime(), 'setTimeout', 'clearTimeout', 'Date');
    return new Promise(resolve => {
      server.register(auth, () => {
        mockDb.getAsync = sinon.stub();
        mockDb.insertAsync = sinon.stub();
        mockDb.viewAsync = sinon.stub();
        server.app.db = mockDb;
        resolve();
      });

      inject = function (request) {
        return new Promise(resolve => {
          server.inject(request, function (response) {
            resolve(response);
          });
        });
      };
    });

  });

  afterEach(() => {
    clock.restore();
  });

  describe('with authorised github user', function () {

    beforeEach(() => {

      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        userId: 'test1234'
      }));
      mockDb.getAsync.withArgs('test1234').returns(Promise.resolve({
        displayName: 'anna',
        scope: ['login']
      }));

      mockDb.insertAsync.returns(Promise.resolve({}));
    });

    it('returns the access token cookie', function () {

      return inject({
        method: 'GET',
        url: '/api/auth/github'
      }).then(response => {
        expect(response, 'to contain the authorization headers');
      });

    });

    it('stores the refresh token', function () {
      return inject({
        method: 'GET',
        url: '/api/auth/github'
      }).then(() => {
        expect(mockDb.insertAsync, 'to have a call satisfying', [{
          _id: expect.it('to match', /^[a-f0-9]+-refresh$/),
          type: 'refresh-token',
          userId: 'test1234',
          displayName: 'Mrs Unit Test',
          scope: ['login']
        }]);
      });
    });
  });

  describe('with authorised but not yet approved github user', function () {

    beforeEach(() => {

      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        userId: 'test1234'
      }));
      mockDb.getAsync.withArgs('test1234').returns(Promise.resolve({
        displayName: 'anna',
        scope: []
      }));

      mockDb.insertAsync.returns(Promise.resolve({}));
    });

    it('returns the access token cookie', function () {

      return inject({
        method: 'GET',
        url: '/api/auth/github'
      }).then(response => {
        expect(response, 'not to contain the authorization headers');
      });
    });

  });

  describe('with an unknown but valid github user', function () {

    beforeEach(() => {

      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.reject({
        statusCode: 404
      }));
      mockDb.insertAsync.returns(Promise.resolve({}));
    });

    it('redirects to /auth/awaiting-approval without authorizing', function () {
      return inject({
        method: 'GET',
        url: '/api/auth/github'
      }).then(response => {
        expect(response.statusCode, 'to equal', 302);
        expect(response.headers.location, 'to equal', '/auth/awaiting-approval');
        expect(response, 'not to contain the authorization headers');
      });
    });

    it('creates the email and user documents', function () {
      return inject({
        method: 'GET',
        url: '/api/auth/github'
      }).then(() => {
        expect(mockDb.insertAsync, 'to have calls satisfying', function () {
          mockDb.insertAsync({
            _id: 'test@foo.com-email',
            type: 'user-email',
            authType: 'github',
            userId: expect.it('to match', /^[a-f0-9]+/)
          });

          mockDb.insertAsync({
            _id: expect.it('to match', /^[a-f0-9]+/),
            type: 'user',
            displayName: 'Mrs Unit Test',
            scope: []
          });
        });
      });
    });
  });


  describe('with a user with a sha1-bcrypt password', function () {

    beforeEach(() => {

      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        _id: 'test@foo.com-email',
        _rev: '3-111222',
        userId: 'test1234',
        authType: 'password',
        algorithm: 'sha1-bcrypt',
        password: BIG_S3CRET_SHA1_BCRYPT
      }));

      mockDb.getAsync.withArgs('test1234').returns(Promise.resolve({
        scope: ['login'],
        displayName: 'Mrs Foo'
      }));

      mockDb.insertAsync.returns(Promise.resolve({}));
    });

    it('authorises the user when the password is valid', function () {

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'bigS3cret'
        }
      }).then(response => {
        expect(response, 'to contain the authorization headers');
      });
    });

    it('does not authorise the user when the password is invalid', function () {

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'wrong'
        }
      }).then(response => {
        expect(response, 'not to contain the authorization headers');
      });
    });

    it('stores the refresh token', function () {

      mockDb.getAsync.withArgs('test1234').returns(Promise.resolve({
        scope: ['login']
      }));

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'bigS3cret'
        }
      }).then(() => {
        expect(mockDb.insertAsync, 'to have a call satisfying', [
          {
            _id: expect.it('to match', /^[a-f0-9]+-refresh$/),
            userId: 'test1234',
            type: 'refresh-token',
            scope: ['login'],
            created: Date.now() / 1000  // Date.now() is stubbed
          }
        ]);
      });
    });

    it('returns the user email and displayName when the password is valid', function () {

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'bigS3cret'
        }
      }).then(response => {
        expect(response.result, 'to satisfy', {
          email: 'test@foo.com',
          displayName: 'Mrs Foo'
        });
      });
    });

    it('returns unauthorized when the authType for the user is not `password`', function () {
      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        authType: 'github',
        userId: 'test1234'
      }));

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'bigS3cret'
        }
      }).then(response => {
        expect(response.statusCode, 'to equal', 401);
        expect(response, 'not to contain the authorization headers');
      });
    });

    it('sets the failed count to 1 when the password is wrong', function () {

      mockDb.insertAsync.returns(Promise.resolve({}));
      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'wrong'
        }
      }).then(() => {
        expect(mockDb.insertAsync, 'to have calls satisfying', function () {
          mockDb.insertAsync({
            _id: 'test@foo.com-email',
            _rev: '3-111222',
            failedLogins: 1
          });
        });
      });
    });

    it('increases the failed count when the password is wrong', function () {

      mockDb.insertAsync.returns(Promise.resolve({}));
      mockDb.getAsync.reset();
      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        _id: 'test@foo.com-email',
        _rev: '4-111222',
        authType: 'password',
        failedLogins: 1,
        userId: 'test1234',
        algorithm: 'sha1-bcrypt',
        password: BIG_S3CRET_SHA1_BCRYPT
      }));

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'wrong'
        }
      }).then(() => {
        expect(mockDb.insertAsync, 'to have calls satisfying', function () {
          mockDb.insertAsync({
            _id: 'test@foo.com-email',
            _rev: '4-111222',
            failedLogins: 2
          });
        });
      });
    });

    it('sets the account to locked after 6 failed logins', function () {

      mockDb.insertAsync.returns(Promise.resolve({}));
      mockDb.getAsync.reset();
      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        _id: 'test@foo.com-email',
        _rev: '4-111222',
        authType: 'password',
        failedLogins: 5,
        userId: 'test1234',
        algorithm: 'sha1-bcrypt',
        password: BIG_S3CRET_SHA1_BCRYPT
      }));

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'wrong'
        }
      }).then(() => {
        expect(mockDb.insertAsync, 'to have calls satisfying', function () {
          mockDb.insertAsync({
            _id: 'test@foo.com-email',
            _rev: '4-111222',
            failedLogins: 0,
            accountLocked: Date.now()
          });
        });
      });
    });

    it('fails a login on a locked account before 1 minute is up', function () {

      mockDb.insertAsync.returns(Promise.resolve({}));
      mockDb.getAsync.reset();
      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        _id: 'test@foo.com-email',
        _rev: '4-111222',
        authType: 'password',
        failedLogins: 6,
        accountLocked: Date.now(),
        userId: 'test1234',
        algorithm: 'sha1-bcrypt',
        password: BIG_S3CRET_SHA1_BCRYPT
      }));

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'bigS3cret'
        }
      }).then(response => {
        expect(response.statusCode, 'to equal', 401);
        expect(response.result, 'to satisfy', { message: 'ACCOUNT_LOCKED' });
      });
    });

    describe('on a locked account', function () {
      beforeEach(function () {
        mockDb.insertAsync.returns(Promise.resolve({}));
        mockDb.getAsync.reset();
        mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
          _id: 'test@foo.com-email',
          _rev: '4-111222',
          authType: 'password',
          failedLogins: 0,
          accountLocked: Date.now(),
          userId: 'test1234',
          algorithm: 'sha1-bcrypt',
          password: BIG_S3CRET_SHA1_BCRYPT
        }));
      });

      it('passes a login after 1 minute is up', function () {

        mockDb.getAsync.withArgs('test1234').returns(Promise.resolve({
          displayName: 'Mrs Unit Test',
          scope: ['login']
        }));

        clock.tick(60000);
        return inject({
          method: 'POST',
          url: '/api/auth/signin',
          payload: {
            email: 'test@foo.com',
            password: 'bigS3cret'
          }
        }).then(response => {
          expect(response, 'to contain the authorization headers');
        });
      });

      it('resets the lock after a successful login after 1 minute is up', function () {

        mockDb.getAsync.withArgs('test1234').returns(Promise.resolve({
          displayName: 'Mrs Unit Test',
          scope: ['login']
        }));

        clock.tick(60000);

        return inject({
          method: 'POST',
          url: '/api/auth/signin',
          payload: {
            email: 'test@foo.com',
            password: 'bigS3cret'
          }
        }).then(() => {
          expect(mockDb.insertAsync, 'to have calls satisfying', function () {
            mockDb.insertAsync({
              _id: 'test@foo.com-email',
              failedLogins: undefined,
              accountLocked: undefined
            });

            mockDb.insertAsync({
              type: 'refresh-token'
            });
          });
        });
      });

      it('unlocks the account but increases failedLogins after 1 minute is up and another failed login', function () {

        clock.tick(60000);

        return inject({
          method: 'POST',
          url: '/api/auth/signin',
          payload: {
            email: 'test@foo.com',
            password: 'wrong'
          }
        }).then(() => {
          expect(mockDb.insertAsync, 'to have calls satisfying', function () {
            mockDb.insertAsync({
              _id: 'test@foo.com-email',
              failedLogins: 1,
              accountLocked: undefined
            });
          });
        });
      });
    });
  });

  describe('with a user with a bcrypt password', function () {

    beforeEach(() => {

      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        _id: 'test@foo.com-email',
        _rev: '3-111222',
        userId: 'test1234',
        authType: 'password',
        algorithm: 'bcrypt',
        password: BIG_S3CRET_BCRYPT
      }));

      mockDb.getAsync.withArgs('test1234').returns(Promise.resolve({
        scope: ['login'],
        displayName: 'anna'
      }));

      mockDb.insertAsync.returns(Promise.resolve({}));
    });

    it('authorises the user when the password is valid', function () {

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'bigS3cret'
        }
      }).then(response => {
        expect(response, 'to contain the authorization headers');
      });
    });

    it('does not authorise the user when the password is invalid', function () {

      return inject({
        method: 'POST',
        url: '/api/auth/signin',
        payload: {
          email: 'test@foo.com',
          password: 'wrong'
        }
      }).then(response => {
        expect(response, 'not to contain the authorization headers');
      });
    });
  });

  describe('jwt authentication', function () {

    let token, refresh;
    beforeEach(() => {

      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        userId: 'test1234'
      }));
      mockDb.getAsync.withArgs('test1234').returns(Promise.resolve({
        scope: ['login'],
        displayName: 'anna'
      }));

      mockDb.insertAsync.returns(Promise.resolve({}));

      return inject({
        method: 'GET',
        url: '/api/auth/github'
      }).then(response => {
        console.log('Response is', response.headers);
        // TODO: Use proper cookie parsing library (literally on a plane, am offline just like they talk about)
        const tokenHeader = response.headers['set-cookie'].find(header => /^token=/.test(header));
        const refreshHeader = response.headers['set-cookie'].find(header => /^refresh=/.test(header));
        token = /^token=([^;]+);/.exec(tokenHeader)[1];
        refresh = /^refresh=([^;]+);/.exec(refreshHeader)[1];
      });
    });

    it('authenticates a user with a just-granted token', function () {
      return inject({
        method: 'GET',
        url: '/api/auth',
        headers: {
          authorization: `Bearer ${token}`
        }
      }).then(response => {
        expect(response.statusCode, 'to equal', 200);
        expect(response.result, 'to satisfy', {
          displayName: 'Mrs Unit Test'
        });
      });
    });

    it('does not update the access token when the access token is still valid', function () {
      return inject({
        method: 'GET',
        url: '/api/auth',
        headers: {
          authorization: `Bearer ${token}`,
          'x-refresh-token': refresh
        }
      }).then(response => {
        expect(response.headers['set-cookie'], 'to be falsy');
      });
    });

    it('returns 401 when the token is invalid', function () {
      return inject({
        method: 'GET',
        url: '/api/auth',
        headers: {
          authorization: 'Bearer abcccccccccc',
          'x-refresh-token': refresh
        }
      }).then(response => {
        expect(response.statusCode, 'to equal', 401);
      });
    });

    describe('with an expired access token', function () {

      let response;
      beforeEach(() => {

        clock.tick(5 * 60 * 1000);
        mockDb.getAsync.reset();
        mockDb.getAsync.returns(Promise.resolve({
          userId: 'test1234',
          created: new Date(2016, 1, 1).getTime() / 1000,
          displayName: 'Mrs Unit Test'
        }));
        return inject({
          method: 'GET',
          url: '/api/auth',
          headers: {
            authorization: `Bearer ${token}`,
            'x-refresh-token': refresh
          }
        }).then(res => {
          response = res;
        });
      });

      it('returns success', function () {
        expect(response.statusCode, 'to equal', 200);
        expect(response.result, 'to satisfy', {
          displayName: 'Mrs Unit Test'
        });
      });

      it('returns a new access token', function () {
        expect(response.headers['set-cookie'], 'to match', /token=/);
      });

      it('looks up the refresh token from the database', function () {
        const sha256 = crypto.createHash('sha256');
        sha256.update(refresh);
        expect(mockDb.getAsync, 'to have calls satisfying', function () {
          mockDb.getAsync(sha256.digest('hex') + '-refresh');
        });
      });
    });

    describe('with an expired access and expired refresh token', function () {

      let response;
      beforeEach(() => {

        mockDb.getAsync.reset();
        mockDb.getAsync.returns(Promise.resolve({ userId: 'test1234', created: new Date(2016, 1, 1).getTime() / 1000 }));
        clock.tick(REFRESH_EXPIRY);
        return inject({
          method: 'GET',
          url: '/api/auth',
          headers: {
            authorization: `Bearer ${token}`,
            'x-refresh-token': refresh
          }
        }).then(res => {
          response = res;
        });
      });

      it('returns 401', function () {
        expect(response.statusCode, 'to equal', 401);
      });

      it('sends no updated tokens', function () {
        // This may become truthy, if we make it clear the tokens if they are invalid
        expect(response.headers['set-cookie'], 'to be falsy');
      });

    });

    describe('with an expired access and non-existent refresh-token', function () {

      let response;
      beforeEach(() => {

        mockDb.getAsync.reset();
        mockDb.getAsync.returns(Promise.reject({ statusCode: 404 }));
        clock.tick(ACCESS_EXPIRY);
        return inject({
          method: 'GET',
          url: '/api/auth',
          headers: {
            authorization: `Bearer ${token}`,
            'x-refresh-token': refresh
          }
        }).then(res => {
          response = res;
        });
      });

      it('returns 401', function () {
        expect(response.statusCode, 'to equal', 401);
      });

      it('sends no updated tokens', function () {
        // This may become truthy, if we make it clear the tokens if they are invalid
        expect(response.headers['set-cookie'], 'to be falsy');
      });

    });

  });

  describe('signup with email/password', function () {

    it('creates the email and user docs', function () {
      mockDb.insertAsync.returns(Promise.resolve({}));

      return inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: {
          email: 'test@foo.com',
          password: 'bigS3cret',
          displayName: 'Mrs Unit Test'
        }
      }).then(() => {
        expect(mockDb.insertAsync, 'to have calls satisfying', function () {
          mockDb.insertAsync({
            _id: 'test@foo.com-email',
            type: 'user-email',
            userId: expect.it('to match', /[a-z0-9-]{36}/),
            authType: 'password',
            algorithm: 'bcrypt'
          });
          mockDb.insertAsync({
            _id: expect.it('to match', /[a-z0-9-]{36}/),
            type: 'user',
            displayName: 'Mrs Unit Test',
            email: 'test@foo.com',
            scope: []
          });
        });
      });
    });

    it('returns a success response', function () {

      mockDb.insertAsync.returns(Promise.resolve({}));

      return inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: {
          email: 'test@foo.com',
          password: 'bigS3cret',
          displayName: 'Mrs Unit Test'
        }
      }).then(response => {
        expect(response.result, 'to equal', { success: true });
      });
    });

    describe('when signing up with an existing user', function () {


      beforeEach(function () {

        mockDb.insertAsync
          .withArgs(sinon.match({ _id: 'test@foo.com-email' }))
          .returns(Promise.reject({ statusCode: 409 }));
      });

      it('returns success', function () {
        // TODO: We'll send an email to the user that there was a repeated signup attempt for their user
        return inject({
          method: 'POST',
          url: '/api/auth/signup',
          payload: {
            email: 'test@foo.com',
            password: 'bigS3cret',
            displayName: 'Mrs Unit Test'
          }
        }).then(response => {
          expect(response.result, 'to equal', { success: true });
        });
      });

    });
  });

  describe('/api/auth/approve', function () {
    it('adds the login scope to the given user', function () {
      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        _id: 'test@foo.com-email',
        _rev: '3-111222',
        scope: []
      }));
      mockDb.insertAsync.returns(Promise.resolve({}));

      return inject({
        method: 'POST',
        url: '/api/auth/approve?email=test@foo.com',
        credentials: { displayName: 'admin', scope: ['login', 'admin'] }
      }).then(() => {
        expect(mockDb.insertAsync, 'to have calls satisfying', function () {
          mockDb.insertAsync({
            _id: 'test@foo.com-email',
            _rev: '3-111222',
            scope: ['login']
          });
        });
      });
    });

    it('does not add the login scope to a user with an existing login scope', function () {
      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        _id: 'test@foo.com-email',
        _rev: '3-111222',
        scope: ['login']
      }));
      mockDb.insertAsync.returns(Promise.resolve({}));

      return inject({
        method: 'POST',
        url: '/api/auth/approve?email=test@foo.com',
        credentials: { displayName: 'admin', scope: ['login', 'admin'] }
      }).then(() => {
        expect(mockDb.insertAsync, 'was not called');
      });
    });

    it('does not add the login scope to a user in the `rejected` scope', function () {
      mockDb.getAsync.withArgs('test@foo.com-email').returns(Promise.resolve({
        _id: 'test@foo.com-email',
        _rev: '3-111222',
        scope: ['rejected']
      }));
      mockDb.insertAsync.returns(Promise.resolve({}));

      return inject({
        method: 'POST',
        url: '/api/auth/approve?email=test@foo.com',
        credentials: { displayName: 'admin', scope: ['login', 'admin'] }
      }).then(() => {
        expect(mockDb.insertAsync, 'was not called');
      });
    });

    it('fails with a non admin user', function () {
      return inject({
        method: 'POST',
        url: '/api/auth/approve?email=test@foo.com',
        credentials: { displayName: 'normalUser', scope: ['login'] }
      }).then(response => {
        expect(response.statusCode, 'to equal', 403);
      });
    });
  });
});

