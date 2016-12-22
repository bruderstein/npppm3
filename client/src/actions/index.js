
import { fetch, fetchJson } from '../lib/fetch';

const PLUGIN_LIST_FETCHED = 'PLUGIN_LIST_FETCHED';
const PLUGIN_FETCHED = 'PLUGIN_FETCHED';
const PLUGIN_CREATED = 'PLUGIN_CREATED';
const PLUGIN_FIELD_CHANGED = 'PLUGIN_FIELD_CHANGED';
const PLUGIN_SAVED = 'PLUGIN_SAVED';

const fetchPluginList = function () {
  return fetchJson('/api/plugins')
    .then(response => {
      return {
        type: PLUGIN_LIST_FETCHED,
        response
      };
    });
};

const fetchPlugin = function (id) {
  return fetchJson('/api/plugins/' + id)
    .then(response => {
      return {
        type: PLUGIN_FETCHED,
        response
      };
    });
};

const createNewPlugin = function () {
  return {
    type: PLUGIN_CREATED
  };
};

const fieldChanged = function (pluginId, field, value) {
  return {
    type: PLUGIN_FIELD_CHANGED,
    payload: { pluginId, field, value }
  };
};

const saveNewPlugin = function (plugin) {

  return fetch('/api/plugins', {
    method: 'POST',
    body: {
      definition: plugin.toJS()
    }
  }).then(response => {
    return {
      type: PLUGIN_SAVED,
      payload: { response }
    };
  });
};

export {
  fetchPluginList,
  fetchPlugin,
  createNewPlugin,
  fieldChanged,
  saveNewPlugin
}

export {
  PLUGIN_LIST_FETCHED,
  PLUGIN_FETCHED,
  PLUGIN_CREATED,
  PLUGIN_FIELD_CHANGED,
  PLUGIN_SAVED
};
