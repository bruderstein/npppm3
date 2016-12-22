'use strict';
const boom = require('boom');
const crypto = require('crypto');
const fetch = require('node-fetch');
const joi = require('joi');
const path = require('path');
const url = require('url');
const zip = require('jszip');


const RAW_FILE_IDENTIFIER = {}; // dummy object used for reference

const register = module.exports = function register(server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/api/files',
      config: {
        validate: {
          payload: {
            url: joi.string()
          }
        },
        handler: function (request, reply) {


          return fetch(request.payload.url).then(result => {
            if (result.status === 200) {
              return result.buffer()
            } else {
              throw boom.badRequest('Fetching failed')
            }
          })
            .then(result => {
              return zip.loadAsync(result)
                .catch(e => {
                  // If there was an error interpreting the file as a zip, just return it as a raw file
                  return { isRawFile: RAW_FILE_IDENTIFIER, content: result };
                })
                .then(zipFile => {

                  if (zipFile.isRawFile === RAW_FILE_IDENTIFIER) {
                    const md5 = crypto.createHash('md5');
                    md5.update(zipFile.content);
                    return { isRawFile: RAW_FILE_IDENTIFIER, md5: md5.digest('hex') };
                  }

                  return Promise.all(
                    Object.keys(zipFile.files).map(name => {
                      const file = zipFile.files[name];
                      if (name[name.length - 1] === '/') {
                        return null;
                      }
                      return file.async('nodebuffer')
                        .then(buffer => {
                          const md5 = crypto.createHash('md5');
                          md5.update(buffer);
                          return { name: file.name, md5: md5.digest('hex') };
                        })
                        .catch(e => {

                          throw e;
                        });
                    })
                  );
                }).then(results => {
                  if (results.isRawFile === RAW_FILE_IDENTIFIER) {
                    return reply({ isRawFile: true, files: [ { name: path.basename(url.parse(request.payload.url).path), md5: results.md5 } ] })
                  }
                  reply({ files: results.filter(file => file).sort((a, b) => a.name > b.name) })
                })
            })
            .catch(e => {
              if (e.isBoom) {
                return reply(e)
              }
              console.log('ERROR', e)
              reply(boom.internal())
            });
        }
      }
    }
  ]);

  next();
};

register.attributes = {
  pkg: {
    name: "api-files",
    version: "1.0.0"
  }
};
