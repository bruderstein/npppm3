import { fetchJson } from '../lib/fetch';
import { registerReducer } from '../store';
import { AUTHENTICATION_REQUIRED } from './auth';

const PLUGIN_LIST_FETCHED = 'npppm/pluginList/PLUGIN_LIST_FETCHED';

// Actions
export const fetchPluginList = function () {
  return fetchJson('/api/plugins')
    .then(response => {
      if (response.status === 401) {
        return {
          type: AUTHENTICATION_REQUIRED
        };
      }

      if (response.status !== 200) {
        return {
          type: FETCH_ERROR,
          payload: {
            status: response.status,
            response: response.payload
          }
        };
      }
      return {
        type: PLUGIN_LIST_FETCHED,
        response: response.payload
      };
    });
};

// Reducer
function pluginList(state = null, action) {
  switch (action.type) {
    case PLUGIN_LIST_FETCHED:
      return action.response.plugins;
    default:
      return state;
  }
}

registerReducer('pluginList', pluginList);

export const pluginListSelector = (state) => state.pluginList;

