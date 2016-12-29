'use strict';

const fs = require('fs');
const path = require('path');
module.exports = function () {
  return {
    connections: [
      {
        port: 5003
      },
      {
        port: 443,
        tls: {
          key: fs.readFileSync(path.join(__dirname, '../config/local.key')),
          cert: fs.readFileSync(path.join(__dirname, '../config/local.pem')),
        }
      }

    ],
    registrations: [
      { plugin: './modules/auth' },
      { plugin: './modules/plugins' },
      { plugin: './modules/files' },
      { plugin: './modules/exports' },
      { plugin: './modules/couch' }
    ]
  };
};
