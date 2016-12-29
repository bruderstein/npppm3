'use strict';
const fs = require('fs');
const files = require('../modules/files');
const Hapi = require('hapi');
const path = require('path');
const unexpected = require('unexpected');

const expect = unexpected
  .clone()
  .use(require('unexpected-sinon'))
  .use(require('unexpected-mitm'))
  .use(require('./to-yield-exchange-assertion'));

describe('files modules', function () {

  let server;
  beforeEach(function () {

    server = new Hapi.Server();
    server.connection({ port: 5000 });

    return new Promise(resolve => {
      server.register(files, () => {
        resolve();
      });
    });

  });

  it('returns the contents of the zip', function () {
    return expect(server, 'with http mocked out', {
      request: 'http://example.com/plugin.zip',
      response: {
        headers: {
          'content-type': 'application/zip'
        },
        body: fs.readFileSync(path.join(__dirname, 'fixtures/plugin.zip'))
      } },
      'to yield exchange', {
        request: {
          method: 'POST',
          url: '/api/files',
          payload: {
            url: 'http://example.com/plugin.zip'
          }
        },
        result: {
          files: [
              { name: 'cheese/biscuits.txt', md5: '9945453f7ca223c906883f63c11f16d7' },
              { name: 'foo/bar.dll', md5: '126a8a51b9d1bbd07fddc65819a542c3' },
              { name: 'foo/baz.dat', md5: '3bc3be114fb6323adc5b0ad7422d193a' },
              { name: 'foo/quz/test.txt', md5: 'bb4da129079c12d4ddaee64ba79a03ff' },
              { name: 'foo/realplugin.dll', md5: '7459224f1d967fdc490d9e0a516cf80b' },
              { name: 'plugin.dll', md5: 'd8e8fca2dc0f896fd7cb4cb0031ba249' }
          ]
        }
      });
  });

  it('returns the file itself when the file is not a zip', function () {
    return expect(server, 'with http mocked out', {
      request: 'http://example.com/somePlugin.dll',
      response: {
        headers: {
          'content-type': 'application/octet-stream'
        },
        body: fs.readFileSync(path.join(__dirname, 'fixtures/somePlugin.dll'))
      } },
      'to yield exchange', {
        request: {
          method: 'POST',
          url: '/api/files',
          payload: {
            url: 'http://example.com/somePlugin.dll'
          }
        },
        result: {
          isRawFile: true,
          files: [
            { name: 'somePlugin.dll', md5: '7459224f1d967fdc490d9e0a516cf80b' }
          ]
        }
      });
  });
});
