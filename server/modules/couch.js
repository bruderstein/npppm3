'use strict';
const Promise = require('bluebird');
const db = require('../lib/db');


const register = module.exports = function register(server, options, next) {
  Promise.promisifyAll(db);
  server.app.db = db;
  next();
};

register.attributes = {
  pkg: {
    name: 'api-couch',
    version: '1.0.0'
  }
};

module.exports = register;
