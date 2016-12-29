'use strict';
const { toXml } = require('../lib/xmlConvert');

const register = module.exports = function register(server, options, next) {
  
  server.route([
    {
      method: 'GET',
      path: '/api/xml/current',
      config: {
        handler: function (request, reply) {
          const resultPromise = server.app.db.viewAsync('app', 'current', { include_docs: true })
            .then(resultToXml);
          reply(resultPromise);
        }
        
      }
    },
    {
      method: 'GET',
      path: '/api/xml/published',
      config: {
        handler: function (request, reply) {
          const resultPromise = server.app.db.viewAsync('app', 'published', { include_docs: true })
            .then(resultToXml);
          reply(resultPromise);
        }
      
      }
    },
    {
      method: 'GET',
      path: '/api/hashes/current',
      config: {
        handler: function (request, reply) {
          const resultPromise = server.app.db.viewAsync('app', 'current-hashes')
            .then(hashesToObject);
          reply(resultPromise);
        }
      }
    },
    {
      method: 'GET',
      path: '/api/hashes/published',
      config: {
        handler: function (request, reply) {
          const resultPromise = server.app.db.viewAsync('app', 'published-hashes')
            .then(hashesToObject);
          reply(resultPromise);
        }
      }
    }
  ]);
  next();
};

function resultToXml(result) {
  return Promise.all(result.rows.map(row => toXml({ plugin: row.doc.definition })))
    .then(results => `<plugins created="${new Date().toISOString()}">${results.join('')}</plugins>`);
}

function hashesToObject(result) {
  return result.rows.reduce((hashes, row) => {
    hashes[row.key] = row.value;
    return hashes;
  }, {});
}

register.attributes = {
  pkg: {
    name: 'api-exports',
    version: '1.0.0'
  }
};
