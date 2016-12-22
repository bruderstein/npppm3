'use strict';

module.exports = function () {
  return {
    connections: [
      {
        port: 5003
      }
    ],
    registrations: [
      { plugin: './modules/plugins' },
      { plugin: './modules/files' },
      { plugin: './modules/exports' },
      { plugin: './modules/couch' }
    ]
  };
};
