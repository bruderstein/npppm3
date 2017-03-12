
import { fetchJson } from '../lib/fetch';
import Immutable from 'immutable';
import minimatch from 'minimatch';
import { registerReducer } from '../store';

// Action types
export const PLUGIN_FETCHED = 'npppm/pluginsById/PLUGIN_FETCHED';
export const PLUGIN_CREATED = 'npppm/pluginsById/PLUGIN_CREATED';
export const PLUGIN_FIELD_CHANGED = 'npppm/pluginsById/PLUGIN_FIELD_CHANGED';
export const INSTALL_STEP_FIELD_CHANGED = 'npppm/pluginsById/INSTALL_STEP_FIELD_CHANGED';
export const INSTALL_STEP_ADD = 'npppm/pluginsById/INSTALL_STEP_ADD';
export const PLUGIN_SAVED = 'npppm/pluginsById/PLUGIN_SAVED';
export const FILE_LIST_FETCHED = 'npppm/pluginsById/FILE_LIST_FETCHED';
export const FILE_LIST_FETCH_FAILED = 'npppm/pluginsById/FILE_LIST_FETCH_FAILED';

export const fetchPlugin = function (id) {
  return fetchJson('/api/plugins/' + id)
    .then(response => {
      return {
        type: PLUGIN_FETCHED,
        response
      };
    });
};

export const createNewPlugin = function () {
  return {
    type: PLUGIN_CREATED
  };
};

export const fieldChanged = function (pluginId, field, value) {
  return {
    type: PLUGIN_FIELD_CHANGED,
    payload: { pluginId, field, value }
  };
};

export const installStepChange = function ({ pluginId, installRemove, installType, stepNumber, field, value }) {
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

export const installStepAdd = function ({ pluginId, installRemove, installType, type }) {
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

export const saveNewPlugin = function (plugin) {

  return fetch('/api/plugins', {
    method: 'POST',
    body: stripExtraFields(plugin.toJS())
  }).then(response => {
    return {
      type: PLUGIN_SAVED,
      payload: { response }
    };
  });
};

export const savePlugin = function (pluginId, plugin) {

  return fetch('/api/plugins/' + pluginId, {
    method: 'PUT',
    body: stripExtraFields(plugin.toJS())
  }).then(response => {
    return {
      type: PLUGIN_SAVED,
      payload: { response }
    };
  });
};

const stripExtraFields = function (item) {
  if (item && typeof item === 'object') {
    Object.keys(item).forEach(key => {
      if (key && key[0] === '$') {
        delete item[key];
      } else {
        stripExtraFields(item[key]);
      }
    });
  }
  return item;
};

export const fetchFileList = function ({ pluginId, installRemove, installType, url }) {

  return fetchJson('/api/files', {
    method: 'POST',
    body: {
      url: url
    }
  }).then(response => {
    if (response.status === 200) {
      return {
        type: FILE_LIST_FETCHED,
        payload: {
          pluginId,
          url,
          installRemove,
          installType,
          files: response.payload.files
        }
      };
    }
    return {
      type: FILE_LIST_FETCH_FAILED,
      payload: {
        pluginId,
        url,
        installRemove,
        installType
      }
    };
  });
};

// Reducer
function pluginsById(state = Immutable.Map(), action) {
  switch (action.type) {
    case PLUGIN_FETCHED:
      return state.set(action.response.payload.pluginId, Immutable.fromJS(action.response.payload));

    case PLUGIN_CREATED:
      return state.set('new', Immutable.fromJS({ aliases: [] }));

    case PLUGIN_FIELD_CHANGED: {
      const { pluginId, field, value } = action.payload;
      
      return state.setIn([pluginId, 'definition', field], value);
    }

    case INSTALL_STEP_FIELD_CHANGED: {
      const { pluginId, installRemove, installType, stepNumber, field, value } = action.payload;

      state = state
        .updateIn([pluginId, 'definition', installRemove, installType, stepNumber], (step) => {
          if (step.get('type') === 'copy' && field === 'from' && step.get('$inheritedFiles')) {
            const pattern = patternToRegex(value);
            step = step.update('$inheritedFiles', (files) => highlightInheritedFiles(pattern, files));
          }
          return step.set(field, value);
        });

      return state;
    }

    case INSTALL_STEP_ADD: {
      const { pluginId, installRemove, installType, type } = action.payload;
      state = state
        .mergeDeep({ [pluginId]: { definition: { [installRemove]: { [installType]: [] } } } })
         .updateIn([pluginId, 'definition', installRemove, installType],
           steps => steps.push(Immutable.Map({ type })));
      state = state.updateIn([ pluginId, 'definition', installRemove, installType ], steps => inheritFilesToCopySteps(steps));
      return state;
    }

    case FILE_LIST_FETCHED: {
      const { pluginId, installType, installRemove, url, files } = action.payload;
      const newSteps = state.getIn([pluginId, 'definition', installRemove, installType], Immutable.List())
        .map(step => {
          if (step.get('type') === 'download' && step.get('url') === url) {
            return step.set('$filesAvailable', Immutable.fromJS(files));
          }
          return step;
        });
      return state.setIn([ pluginId, 'definition', installRemove, installType ], inheritFilesToCopySteps(newSteps));
    }

    case FILE_LIST_FETCH_FAILED: {
      const { pluginId, installType, installRemove, url } = action.payload;
      const newSteps = state.getIn([pluginId, 'definition', installRemove, installType], Immutable.List())
        .map(step => {
          if (step.get('type') === 'download' && step.get('url') === url) {
            return step.set('$filesAvailable', null);
          }
          return step;
        });
      return state.setIn([ pluginId, 'definition', installRemove, installType ], inheritFilesToCopySteps(newSteps));
    }

    case PLUGIN_SAVED: {
      const { response } = action.payload;
      if (response.statusCode === 200 || response.statusCode === 201) {
        // TODO: this should probably be `response.body`...
        return state.set(response.pluginId, Immutable.fromJS(response));
      }
      return state;
    }

    default:
      return state;
  }
}


function inheritFilesToCopySteps(steps) {
  let currentFiles = Immutable.List();
  return steps.map(step => {
    if (step.get('type') === 'download' && step.get('$filesAvailable')) {
      currentFiles = mergeFiles(currentFiles, step.get('$filesAvailable'));
    }

    if (step.get('type') === 'copy') {
      step = step.set('$inheritedFiles', highlightInheritedFiles(patternToRegex(step.get('from')), currentFiles));
    }
    return step;
  });
}

function mergeFiles(current, newFiles) {
  const newFilesMap = newFiles.reduce((filesMap, item) => {
    filesMap[item.get('name')] = item;
    return filesMap;
  }, {});

  const resultingFileList = newFiles.withMutations(resultingFileList => {
    current.forEach(file => {
      if (!newFilesMap[file.get('name')]) {
        resultingFileList.push(file);
      }
    });
  });

  return Immutable.List(resultingFileList.sort((a, b) => {
    const aName = a.get('name');
    const bName = b.get('name');
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    return 0;
  }));
}

function patternToRegex(pattern) {
  if (!pattern) {
    return /^$/;
  }
  return minimatch.makeRe(pattern, { nocase: true, nocomment: true, noext: true, noglobstar: true, nonegate: true });
}

function highlightInheritedFiles(pattern, inheritedFiles) {
  return inheritedFiles.map(file => {
    return file.set('highlighted', pattern.test(file.get('name')));
  });
}

registerReducer('pluginsById', pluginsById);

// For tests
export { pluginsById as pluginsByIdReducer };

// Plugin Selector
export function pluginById(state, id) {
  return state.pluginsById.get(id);
}

// Hashes Selector

const hashSelector = function (state, pluginId) {
  return state.pluginsById.getIn([pluginId, 'hashes']) || Immutable.Map();
};

export { hashSelector };


