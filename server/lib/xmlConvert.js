const Promise = require('bluebird');
const pluginXmlSchema = require('./pluginXmlSchema');
const XmlJsConverter = require('xml-js-converter');

Promise.promisifyAll(XmlJsConverter);

function toXml(pluginDefinition) {
  return XmlJsConverter.toXmlAsync(pluginDefinition, pluginXmlSchema);
}

function fromXml(pluginXmlString) {
  return XmlJsConverter.fromXmlAsync(pluginXmlString, pluginXmlSchema);
}

module.exports = { toXml, fromXml };
