'use strict';

const config = require('../config');
const db = require('nano')(config.get('couch.url'));

module.exports = db;