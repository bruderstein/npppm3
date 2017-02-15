const joi = require('joi');

const VERSION_VALIDATION = joi.string().regex(/[0-9]+(\.[0-9]+){0,3}/);

const stepSchema = joi.alternatives().try(
  joi.object({
    type: joi.string().required().valid('download'),
    url: joi.string().required()
  }),
  joi.object({
    type: joi.string().required().valid('copy'),
    from: joi.string().required(),
    to: joi.string().required().allow('')
  }),
  joi.object({
    type: joi.string().required().valid('run'),
    path: joi.string().required()
  }),
  joi.object({
    type: joi.string().required().valid('delete'),
    path: joi.string().required()
  })
);

const pluginSchema = {
  name: joi.string().required(),
  description: joi.string().required(),
  author: joi.string().required(),
  homepage: joi.string().allow('', null),
  sourceUrl: joi.string().allow('', null),
  latestUpdate: joi.string().allow('', null),
  stability: joi.string().allow('', null),
  aliases: joi.array(joi.string().required()),
  dependencies: joi.array(joi.string().required()),
  minNppVersion: joi.string().regex(/[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}/).allow('', null),
  maxNppVersion: joi.string().regex(/[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}/).allow('', null),
  isLibrary: joi.boolean().default(false),
  versions: joi.array(joi.object({
    hash: joi.string().regex(/[0-9a-f]{32}/),
    version: VERSION_VALIDATION,
    comment: joi.string().required()
  })),
  unicodeVersion: VERSION_VALIDATION.allow(''),
  x64Version: VERSION_VALIDATION.allow(''),
  install: joi.object({
    unicode: joi.array().items(stepSchema),
    x64: joi.array().items(stepSchema),
    ansi: joi.array().items(stepSchema)
  })
};

module.exports = joi.object(pluginSchema);
