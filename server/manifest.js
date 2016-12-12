'use strict';

module.exports = function () {
  return {
    connections: [
      {
        port: 5000
      }
    ],
    registrations: [
      { plugin: './modules/plugins' },
      { plugin: './modules/exports' },
      { plugin: './modules/couch' }
    ]
  };
};