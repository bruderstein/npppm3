'use strict';
const glue = require('glue');
const manifest = require('./manifest');

module.exports = glue.compose(manifest(), {
  relativeTo: __dirname
});
