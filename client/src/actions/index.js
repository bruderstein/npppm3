
import { fetchJson } from '../lib/fetch';

const PLUGIN_LIST_FETCHED = 'PLUGIN_LIST_FETCHED';
const PLUGIN_FETCHED = 'PLUGIN_FETCHED';

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

export {
  fetchPluginList,
  fetchPlugin
}

export {
  PLUGIN_LIST_FETCHED,
  PLUGIN_FETCHED
};
