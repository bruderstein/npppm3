
import { fetch, fetchJson } from '../lib/fetch';
import { browserHistory } from 'react-router';

const LOGGED_IN = 'LOGIN';
const PLUGIN_LIST_FETCHED = 'PLUGIN_LIST_FETCHED';
const PLUGIN_FETCHED = 'PLUGIN_FETCHED';
const PLUGIN_CREATED = 'PLUGIN_CREATED';
const PLUGIN_FIELD_CHANGED = 'PLUGIN_FIELD_CHANGED';
const INSTALL_STEP_FIELD_CHANGED = 'INSTALL_STEP_FIELD_CHANGED';
const INSTALL_STEP_ADD = 'INSTALL_STEP_ADD';
const PLUGIN_SAVED = 'PLUGIN_SAVED';
const FETCH_ERROR = 'FETCH_ERROR';
const FILE_LIST_FETCHED = 'FILE_LIST_FETCHED';

const login = function (email, password) {

  return fetch('/api/auth/signin', {
    method: 'POST',
    body: { email, password },
    credentials: 'include'
  }).then(response => {
    if (response.statusCode === 200) {
      browserHistory.push('/plugins');
      return {
        type: LOGGED_IN
      }
    }
  });
};

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

const installStepChange = function ({ pluginId, installRemove, installType, stepNumber, field, value}) {
  return {
    type: INSTALL_STEP_FIELD_CHANGED,
    payload: {
      pluginId,
      installRemove,
      installType,
      stepNumber,
      field,
      value
    }
  };
};

const installStepAdd = function ({ pluginId, installRemove, installType, type }) {
  return {
    type: INSTALL_STEP_ADD,
    payload: {
      pluginId,
      installRemove,
      installType,
      type
    }
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

const savePlugin = function (pluginId, plugin) {

  return fetch('/api/plugins/' + pluginId, {
    method: 'PUT',
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

const fetchFileList = function ({ pluginId, installRemove, installType, url }) {

  return fetchJson('/api/files', {
    method: 'POST',
    body: {
      url: url
    }
  }).then(response => {
    return {
      type: FILE_LIST_FETCHED,
      payload: {
        pluginId,
        url,
        installRemove,
        installType,
        files: response.files
      }
    };
  });
};

export {
  login,
  fetchPluginList,
  fetchPlugin,
  createNewPlugin,
  fieldChanged,
  installStepChange,
  installStepAdd,
  saveNewPlugin,
  savePlugin,
  fetchFileList
}

export {
  LOGGED_IN,
  PLUGIN_LIST_FETCHED,
  PLUGIN_FETCHED,
  PLUGIN_CREATED,
  PLUGIN_FIELD_CHANGED,
  INSTALL_STEP_FIELD_CHANGED,
  INSTALL_STEP_ADD,
  PLUGIN_SAVED,
  FILE_LIST_FETCHED
};
