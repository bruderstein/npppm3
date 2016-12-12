'use strict';
const joi = require('joi');
const plugins = require('../modules/plugins');
const pluginSchema = require('../modules/pluginSchema');
const server = require('../server');
const sinon = require('sinon');
const unexpected = require('unexpected');
const uuid = require('uuid');

const PLUGIN_ID = uuid();
const UUID_REGEX = /^[a-f0-9-]{36}$/;
const mockDb = {};

const expect = unexpected
  .clone()
  .use(require('unexpected-sinon'));

expect.addAssertion('<object> to yield exchange <object>', function (expect, server, exchange) {
  return new Promise((resolve, reject) => {
    server.inject(exchange.request, function (response) {
      resolve(response)
    });
  }).then(response => {
    expect.errorMode = 'bubble';
    if (exchange.result) {
      expect(response.result, 'to satisfy', exchange.result);
    }
    if (exchange.response) {
      expect(response, 'to satisfy', exchange.response)
    }
  });
});

expect.addType({
  name: 'JoiSchema',
  base: 'object',
  identify: value => value && typeof value === 'object' && value.isJoi === true && typeof value._type === 'string',
  inspect: function (value, inspect, output) {
    return output.text('<JoiSchema>');
  }
});

expect.addAssertion('<any> [not] to validate against schema <JoiSchema>', function (expect, subject, schema) {
  const result = joi.validate(subject, schema, { abortEarly: this.flags.not });
  if (result.error && !this.flags.not) {
    // expect.errorMode = 'bubble';
    expect.fail({
      diff: function (output) { return output.error(result.error); }
    })
  }

  if (!result.error && this.flags.not) {
    expect.fail();
  }
});

describe('server - plugins', function () {

  let instance;
  beforeEach(function () {
    
    return server.then(i => {
      instance = i;
      mockDb.getAsync = sinon.stub();
      mockDb.insertAsync = sinon.stub();
      mockDb.viewAsync = sinon.stub();
      instance.app.db = mockDb;
    });
    
  });

  describe('plugin validation', function () {

    describe('validation assertion', function () {

      it('validates a valid object', function () {
        const schema = joi.object({ name: joi.string().regex(/^[a-f]+$/).required() });
        expect({ name: 'abcdef' }, 'to validate against schema', schema);
      });

      it('fails with the error when it doesn`t match', function () {
        const schema = joi.object({ name: joi.string().regex(/^[a-f]+$/).required() });
        expect(
          () => expect({ name: 'abcdefg' }, 'to validate against schema', schema),
          'to throw',
          [
            `expected { name: 'abcdefg' } to validate against schema <JoiSchema>`,
            '',
            'ValidationError: child "name" fails because ["name" with value "abcdefg" fails to match the required pattern: /^[a-f]+$/]'
          ].join('\n')
        );
      });

      it('accepts an error when [not] is provided', function () {
        const schema = joi.object({ name: joi.string().regex(/^[a-f]+$/).required() });
        expect({ name: 'abcdefg' }, 'not to validate against schema', schema);
      });
      it('fails when it does match but [not] is provided', function () {
        const schema = joi.object({ name: joi.string().regex(/^[a-f]+$/).required() });
        expect(
          () => expect({ name: 'abcdef' }, 'not to validate against schema', schema),
          'to throw',
          `expected { name: 'abcdef' } not to validate against schema <JoiSchema>`
        );
      });
    });

    it('identifies the schema as a joi schema', function () {
      expect(pluginSchema, 'to be a', 'JoiSchema');
    });

    it('acccepts a plugin with just a name, description, author', function () {
      expect({ name: 'some plugin', description: 'does stuff', author: 'me' }, 'to validate against schema', pluginSchema);
    });

    it('acccepts a plugin with all values filled out (but without steps)', function () {
      expect({
        name: 'some plugin',
        description: 'does stuff',
        author: 'me',
        homepage: 'http://blah',
        sourceUrl: 'http://github.com/blah',
        latestUpdate: 'changed stuff',
        stability: 'awesome',
        aliases: ['ace plugin', 'amazing plugin', 'actually probably not very good plugin'],
        dependencies: ['some library'],
        minNppVersion: '5.7.11',
        maxNppVersion: '6.1.0',
        isLibrary: false,
        versions: [ { hash: 'aaaabbbbccccddddeeeeffff11112222', version: '1.2.456.1', comment: 'unicode' } ],
        unicodeVersion: '1.5.1111.491',
        x64Version: '1.6'
      }, 'to validate against schema', pluginSchema);
    });

    it('does not allow extra attributes', function () {
      expect({
        name: 'some plugin',
        description: 'does stuff',
        author: 'me',
        something: 'we dont know'
      }, 'not to validate against schema', pluginSchema);
    });

    it('allows a copy step', function () {
      expect({
          name: 'x', description: 'y', author: 'me',
        install: [
          { 
            unicode: [
              { type: 'copy', from: 'plugin.dll', toPrefix: '$PLUGINDIR$', to: '' }
            ]
          }
        ]
      }, 'to validate against schema', pluginSchema);
    });
    
    it('errors if a copy step attribute is missing', function () {
  
      expect({
        name: 'x', description: 'y', author: 'me',
        install: [
          {
            unicode: [
              { type: 'copy', from: 'plugin.dll' }
            ]
          }
        ]
      }, 'not to validate against schema', pluginSchema);
    });
  });
  
  it('allows a download step', function () {
    expect({
      name: 'x', description: 'y', author: 'me',
      install: [
        {
          unicode: [
            { type: 'download', url: 'http://blah' }
          ],
          x64: [
            { type: 'download', url: 'http://blah' }
          ]
        }
      ]
    }, 'to validate against schema', pluginSchema);
  });
  
  it('allows a run step', function () {
    expect({
      name: 'x', description: 'y', author: 'me',
      install: [
        {
          unicode: [
            { type: 'run', path: 'blah' }
          ],
          x64: [
            { type: 'run', path: 'blah' }
          ]
        }
      ]
    }, 'to validate against schema', pluginSchema);
  });

  describe('GET /api/plugins', function () {
  
    it('returns the plugin list for the web list', function () {
  
      mockDb.viewAsync.returns(Promise.resolve({
        rows: [
          {
            id: 'aaa',
            value: {
              pluginId: 'aaa', name: 'test 1', lastModified: 123123,
              description: 'the a', unicodeVersion: '1.7.0', x64Version: '', author: 'me', published: true
            }
          },
          {
            id: 'bbb',
            value: {
              pluginId: 'bbb',
              name: 'test 2',
              lastModified: 124124,
              description: 'the b',
              ansiVersion: '1.0.4',
              unicodeVersion: '2.9.1',
              x64Version: '2.9.2',
              author: 'not me',
              published: false
            }
          }
        ]
      }));
      
      return expect(instance, 'to yield exchange', {
        request: '/api/plugins',
        result: {
          plugins: [
            { pluginId: 'aaa', name: 'test 1', lastModified: new Date(123123).toISOString(), description: 'the a',
              unicodeVersion: '1.7.0', x64Version: '', author: 'me', published: true
            },
            { pluginId: 'bbb', name: 'test 2', lastModified: new Date(124124).toISOString(), description: 'the b',
              ansiVersion: '1.0.4', unicodeVersion: '2.9.1', x64Version: '2.9.2', author: 'not me', published: false
            }
          ]
        }
      });
    
    });
  });
  
  describe('POST /api/plugins', function () {
    beforeEach(function () {
  
      mockDb.insertAsync = sinon.stub();
      mockDb.insertAsync.withArgs(sinon.match({ type: 'current' })).returns(Promise.resolve({
        id: '1234', rev: '1-abcdef'
      }));
  
      mockDb.insertAsync.withArgs(sinon.match({ type: 'edit-history' })).returns(Promise.resolve({
        id: 'history-123abc', rev: '1-9876'
      }));
  
    });
    
    it('returns the pluginId and rev', function () {
    
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'POST',
          url: '/api/plugins',
          payload: {
            definition: {
              name: 'test 1', description: 'the a',
              unicodeVersion: '1.7.0', x64Version: '', author: 'me'
            }
          }
        },
        result:  { pluginId: '1234', _rev: '1-abcdef' }
      });
    
    });
    
    it('issues both inserts for current and edit-history', function () {
    
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'POST',
          url: '/api/plugins',
          payload: {
            definition: {
              name: 'test 1', description: 'the a',
              unicodeVersion: '1.7.0', x64Version: '', author: 'me'
            }
          }
        },
        result:  { pluginId: '1234', _rev: '1-abcdef' }
      }).then(() => {
        return expect(mockDb.insertAsync, 'to have calls satisfying', function () {
          mockDb.insertAsync({ definition: { name: 'test 1' }});
          mockDb.insertAsync({ _id: expect.it('to match', UUID_REGEX), type: 'edit-history', pluginId: '1234' });
        });
      }).then(() => {
        // The editId of the first call, should be the id of the second
        expect(mockDb.insertAsync.args[0][0].editId, 'to equal', mockDb.insertAsync.args[1][0]._id);
      });
    
    });
    
  });
  
  describe('PUT /api/plugins/{pluginId}', function () {
    beforeEach(function () {
      
      mockDb.insertAsync = sinon.stub();
      mockDb.insertAsync.withArgs(sinon.match({ type: 'current' })).returns(Promise.resolve({
        id: PLUGIN_ID, rev: '2-123abc'
      }));
      
      mockDb.insertAsync.withArgs(sinon.match({ type: 'edit-history' })).returns(Promise.resolve({
        id: 'history-234567', rev: '1-9876'
      }));
      
    });
    
    it('returns the pluginId and new rev', function () {
      
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'PUT',
          url: '/api/plugins/' + PLUGIN_ID,
          payload: {
            _rev: '1-abcdef',
            definition: {
              name: 'test 1', description: 'the a',
              unicodeVersion: '1.7.0', x64Version: '', author: 'me'
            }
          }
        },
        result:  { pluginId: PLUGIN_ID, _rev: '2-123abc' }
      });
      
    });
    
    it('issues both updates for current and insert edit-history', function () {
      
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'PUT',
          url: '/api/plugins/' + PLUGIN_ID,
          payload: {
            _rev: '1-abcdef',
            definition: {
              name: 'test 1', description: 'the a',
              unicodeVersion: '1.7.0', x64Version: '', author: 'me'
            }
          }
        },
        result:  { pluginId: PLUGIN_ID, _rev: '2-123abc' }
      }).then(() => {
        return expect(mockDb.insertAsync, 'to have calls satisfying', function () {
          mockDb.insertAsync({ _id: PLUGIN_ID, _rev: '1-abcdef', definition: { name: 'test 1' }});
          mockDb.insertAsync({ _id: expect.it('to match', UUID_REGEX) });
        });
      }).then(() => {
        // The editId of the first call, should be the id of the second
        expect(mockDb.insertAsync.args[0][0].editId, 'to equal', mockDb.insertAsync.args[1][0]._id);
      });
      
    });
    
    it('returns a 409 with the new definition and rev when the first request 409s', function () {
  
      mockDb.insertAsync = sinon.stub();
      mockDb.insertAsync
        .withArgs(sinon.match({ type: 'current' }))
        .returns(Promise.reject({ statusCode: 409 }));
      mockDb.getAsync
        .withArgs(PLUGIN_ID)
        .returns(Promise.resolve({ _id: PLUGIN_ID, _rev: '2-123abc', type: 'current', definition: { name: 'test 2' } }));
      
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'PUT',
          url: '/api/plugins/' + PLUGIN_ID,
          payload: {
            _rev: '1-abcdef',
            definition: {
              name: 'test 1', description: 'the a',
              unicodeVersion: '1.7.0', x64Version: '', author: 'me'
            }
          }
        },
        response: {
          statusCode: 409,
          result: { definition: { name: 'test 2' }, _rev: '2-123abc' }
        }
      });
    });
    
    it('returns a 500 if an attempt is made to update a key that isn`t a current plugin', function () {
      mockDb.insertAsync = sinon.stub();
      mockDb.insertAsync
        .withArgs(sinon.match({ type: 'current' }))
        .returns(Promise.reject({ statusCode: 409 }));
      
      // Fetching returns not a 'current', but /something else/ (this data should never be exposed
      mockDb.getAsync
        .withArgs(PLUGIN_ID)
        .returns(Promise.resolve({ _id: PLUGIN_ID, _rev: '2-123abc', type: 'edit-history', definition: { name: 'test 2' } }));
  
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'PUT',
          url: '/api/plugins/' + PLUGIN_ID,
          payload: {
            _rev: '1-abcdef',
            definition: {
              name: 'test 1', description: 'the a',
              unicodeVersion: '1.7.0', x64Version: '', author: 'me'
            }
          }
        },
        response: {
          statusCode: 500,
          // And check we don't get any information back
          result: { _rev: undefined, definition: undefined }
        }
      });
    });
    
  });
  
  describe('GET /plugins/{pluginId}', function () {
  
    it('returns the pluginId and current rev', function () {
  
      mockDb.getAsync
        .withArgs(PLUGIN_ID)
        .returns(Promise.resolve({ _id: PLUGIN_ID, _rev: '2-123abc', type: 'current', definition: { name: 'test 2' } }));
  
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'GET',
          url: '/api/plugins/' + PLUGIN_ID
        },
        response: {
          statusCode: 200,
          result: { _rev: '2-123abc', pluginId: PLUGIN_ID, definition: { name: 'test 2' } }
        }
      });
    });
    
    it('fails if the pluginId is not a current plugin', function () {
      mockDb.getAsync
        .withArgs(PLUGIN_ID)
        .returns(Promise.resolve({ _id: PLUGIN_ID, _rev: '2-123abc', type: 'edit-history', definition: { name: 'test 2' } }));
  
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'GET',
          url: '/api/plugins/' + PLUGIN_ID
        },
        response: {
          statusCode: 500,
          result: { _rev: undefined, _id: undefined, pluginId: undefined, definition: undefined }
        }
      });
      
    });
    
  });
  
  describe('POST /api/plugins/{pluginId}/publish', function () {
    
    beforeEach(function () {
      mockDb.getAsync = sinon.stub();
      mockDb.insertAsync = sinon.stub();
    });
    
    it('updates the published and publishUniqueId in current', function () {
      
      mockDb.getAsync
        .withArgs(PLUGIN_ID)
        .returns(Promise.resolve({ _id: PLUGIN_ID, _rev: '3-123abc', type: 'current', definition: { name: 'test 2' } }));
      
      mockDb.getAsync
        .withArgs(PLUGIN_ID + '-published')
        .returns(Promise.resolve({ _id: PLUGIN_ID + '-published', _rev: '1-6111', type: 'published', definition: { name: 'test 2' } }));
      
      mockDb.insertAsync
        .withArgs(sinon.match({ _id: PLUGIN_ID, _rev: '3-123abc' }))
        .returns(Promise.resolve({ id: PLUGIN_ID, rev: '4-234abc' }));
  
      mockDb.insertAsync
        .withArgs(sinon.match({  type: 'published' }))
        .returns(Promise.resolve({ id: PLUGIN_ID + '-published', rev: '2-5959' }));
      
      mockDb.insertAsync
        .withArgs(sinon.match({ type: 'publish-history' }))
        .returns(Promise.resolve({ id: '6111', rev: '2-111bbb' }));
      
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'POST',
          url: '/api/plugins/' + PLUGIN_ID + '/publish',
          payload: {
            _rev: '3-123abc'
          }
        },
        response: {
          statusCode: 200,
          result: { published: true, _rev: '4-234abc' }
        }
      }).then(() => {
        expect([mockDb.getAsync, mockDb.insertAsync], 'to have calls satisfying', function () {
          mockDb.getAsync(PLUGIN_ID);
          mockDb.insertAsync({
            _id: PLUGIN_ID,
            _rev: '3-123abc',
            definition: { name: 'test 2' },
            published: true,
            publishHistoryId: expect.it('to match', UUID_REGEX)
          });
          mockDb.getAsync(PLUGIN_ID + '-published');
          mockDb.insertAsync({
            _id: PLUGIN_ID + '-published',
            pluginId: PLUGIN_ID,
            definition: { name: 'test 2' }
          });
          
          mockDb.insertAsync({
            _id: expect.it('to match', UUID_REGEX),
            type: 'publish-history',
            pluginId: PLUGIN_ID,
            publishedRev: '2-5959'
          });
        });
      });
    });
  
    it('returns the current plugin definition with 409 if the update 409s', function () {
    
      mockDb.getAsync = sinon.stub();
      mockDb.getAsync
        .withArgs(PLUGIN_ID)
        .returns(Promise.resolve({ _id: PLUGIN_ID, _rev: '4-234abc', type: 'current', definition: { name: 'test 3' } }));
    
      mockDb.insertAsync
        .withArgs(sinon.match({ _id: PLUGIN_ID, _rev: '3-123abc' }))
        .returns(Promise.reject({ statusCode: 409 }));
    
      return expect(instance, 'to yield exchange', {
        request: {
          method: 'POST',
          url: '/api/plugins/' + PLUGIN_ID + '/publish',
          payload: {
            _rev: '3-123abc'
          }
        },
        response: {
          statusCode: 409,
          result: { published: false, _rev: '4-234abc', definition: { name: 'test 3' } }
        }
      }).then(() => {
        expect([mockDb.getAsync, mockDb.insertAsync], 'to have calls satisfying', function () {
          mockDb.getAsync(PLUGIN_ID);
          mockDb.insertAsync({
            _id: PLUGIN_ID,
            _rev: '3-123abc',
            definition: { name: 'test 3' },
            published: true,
            publishHistoryId: expect.it('to match', /^[a-f0-9-]{36}$/)
          });
        });
      });
    });
  });
});