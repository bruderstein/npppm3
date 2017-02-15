'use strict';
const boom = require('boom');
const joi = require('joi');
const pluginSchema = require('./pluginSchema');
const recordTypes = require('../lib/recordTypes');
const uuid = require('uuid');

const UUID_REGEX = /^[a-f0-9-]{36}$/;
const MD5_REGEX = /^[a-fA-F0-9-]{32,36}$/;
const HASHES_SCHEMA = joi.array().items(joi.object({
  hash: joi.string().regex(MD5_REGEX).required(),
  response: joi.string().valid('ok', 'bad', 'unknown')
}));

const register = module.exports = function register(server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/api/plugins',
      config: {
        handler: function (request, reply) {
          
          const responsePromise = server.app.db.viewAsync('app', 'currentweb')
            .then(result => {
              return {
                plugins: result.rows.map(row => ({
                  pluginId: row.id,
                  lastModified: new Date(row.value.lastModified).toISOString(),
                  name: row.value.name,
                  description: row.value.description,
                  ansiVersion: row.value.ansiVersion,
                  unicodeVersion: row.value.unicodeVersion,
                  x64Version: row.value.x64Version,
                  author: row.value.author,
                  published: row.value.published || false
                }))
              };
            }).catch(e => {
              console.log(e, e.stack);
              throw e;
            });
          reply(responsePromise);
  
        }
      }
    },
    {
      method: 'POST',
      path: '/api/plugins',
      config: {
        
        validate: {
          payload: {
            definition: pluginSchema,
            hashes: HASHES_SCHEMA
          }
        },
        handler: function (request, reply) {
          const pluginId = uuid();
          const editId = uuid();
          const resultPromise = server.app.db.insertAsync({type: recordTypes.CURRENT,
            _id: pluginId,
            editId,
            definition: request.payload.definition,
            hashes: request.payload.hashes,
            datestamp: Date.now()
          }).then(result => {
            return server.app.db.insertAsync({
              type: recordTypes.EDIT_HISTORY,
              _id: editId,
              pluginId: result.id,
              definition: request.payload.definition,
              hashes: request.payload.hashes,
              datestamp: Date.now()
            })
              .then(() => ({ pluginId: result.id, _rev: result.rev }));
          });

          return reply(resultPromise);
        }
      }
    },
    {
      method: 'PUT',
      path: '/api/plugins/{pluginId}',
      config: {
        validate: {
          params: {
            pluginId: joi.string().regex(UUID_REGEX)
          },
          payload: {
            _rev: joi.string().required(),
            definition: pluginSchema,
            pluginId: joi.string().allow(null, ''),  // optional, and it's ignored, but allows the client
                                                     // to send the same thing they get from the GET request
            hashes: HASHES_SCHEMA
          }
        },
        handler: function (request, reply) {
          const editId = uuid();
          const resultPromise = server.app.db.insertAsync({
            _id: request.params.pluginId,
            _rev: request.payload._rev,
            type: recordTypes.CURRENT,
            editId,
            datestamp: Date.now(),
            definition: request.payload.definition
          }).catch(err => {
            if (err && err.statusCode === 409) {
              const response = boom.conflict('conflict');
              return server.app.db.getAsync(request.params.pluginId)
                .then(result => {
                  if (result.type !== recordTypes.CURRENT) {
                    return Promise.reject(boom.internal());
                  }
  
                  response.output.payload.definition = result.definition;
                  response.output.payload._rev = result._rev;
  
                  return Promise.reject(response);
                });
            }
            return Promise.reject(err);
          }).then(result => {
            return server.app.db.insertAsync(
              { type: recordTypes.EDIT_HISTORY,
                _id: editId,
                datestamp: Date.now(),
                definition: request.payload.definition
              })
              .then(() => ({ pluginId: result.id, _rev: result.rev }));
          });
            
          reply(resultPromise);
        }
      }
    },
    {
      method: 'GET',
      path: '/api/plugins/{pluginId}',
      config: {
        validate: {
          params: {
            pluginId: joi.string().regex(UUID_REGEX)
          }
        },
        handler: function (request, reply) {
          const resultPromise = server.app.db.getAsync(request.params.pluginId)
            .then(result => {
              if (result.type !== recordTypes.CURRENT) {
                return Promise.reject(boom.internal());
              }
  
              return {
                pluginId: result._id,
                _rev: result._rev,
                published: result.published,
                definition: result.definition
              };
            });
          
          reply(resultPromise);
        }
      }
    },
    {
      method: 'POST',
      path: '/api/plugins/{pluginId}/publish',
      config: {
        validate: {
          params: {
            pluginId: joi.string().regex(UUID_REGEX)
          },
          payload: {
            _rev: joi.string().required()
          }
        },
        handler: function (request, reply) {
          const publishHistoryId = uuid();
          
          const resultPromise = server.app.db.getAsync(request.params.pluginId)
            .then(plugin => {
              const publishedPlugin = Object.assign({}, plugin, {
                published: true,
                publishHistoryId: publishHistoryId,
                _rev: request.payload._rev
              });
              return server.app.db.insertAsync(publishedPlugin).catch(err => {
                if (err.statusCode === 409) {
                  const response = boom.conflict();
                  response.output.payload.definition = plugin.definition;
                  response.output.payload._rev = plugin._rev;
                  response.output.payload.published = false;
                  throw response;
                }
                throw boom.internal();
              }).then(newRev => {
                // Update the current plugin with the new rev
                plugin._rev = newRev.rev;
                return plugin;
              });
            }).then(plugin => {
              // Get the current publish rev
              return server.app.db.getAsync(request.params.pluginId + '-published')
                .catch(() => null)
                .then(published => {
                  if (!published) {
                    published = { _id: request.params.pluginId + '-published' };
                  }
                  const publishedCopy = Object.assign({}, plugin, {
                    _id: published._id,
                    _rev: published._rev,
                    published: true,
                    datestamp: Date.now(),
                    type: recordTypes.PUBLISHED,
                    pluginId: request.params.pluginId,
                    publishHistoryId: publishHistoryId
                  });
                  return server.app.db.insertAsync(publishedCopy);
                })
                .then(publishResult => {
                  return server.app.db.insertAsync({
                    _id: publishHistoryId,
                    type: recordTypes.PUBLISH_HISTORY,
                    pluginId: request.params.pluginId,
                    definition: plugin.definition,
                    editId: plugin.editId,
                    publishedRev: publishResult.rev,
                    datestamp: Date.now()
                  })
                    .then(() => ({ published: true, _rev: plugin._rev }));
                });
            });
          
          reply(resultPromise);
        }
      }
    }
  ]);
  
  next();
};

register.attributes = {
  pkg: {
    name: 'api-plugins',
    version: '1.0.0'
  }
};

