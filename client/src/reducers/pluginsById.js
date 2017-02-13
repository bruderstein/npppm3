
import {
  PLUGIN_FETCHED, PLUGIN_CREATED, PLUGIN_FIELD_CHANGED,
  INSTALL_STEP_FIELD_CHANGED, INSTALL_STEP_ADD,
  PLUGIN_SAVED, FILE_LIST_FETCHED
} from '../actions';

import Immutable from 'immutable';

export default function pluginsById(state = Immutable.Map(), action) {
  switch (action.type) {
    case PLUGIN_FETCHED:
      return state.set(action.response.pluginId, Immutable.fromJS(action.response));

    case PLUGIN_CREATED:
      return state.set('new', Immutable.fromJS({ aliases: [] }));

    case PLUGIN_FIELD_CHANGED: {
      const { pluginId, field, value } = action.payload;
      
      return state.setIn([pluginId, field], value);
    }

    case INSTALL_STEP_FIELD_CHANGED: {
      const { pluginId, installRemove, installType, stepNumber, field, value } = action.payload;

      return state
        .setIn([pluginId, installRemove, installType, stepNumber, field], value);
    }

    case INSTALL_STEP_ADD: {
      const { pluginId, installRemove, installType, type } = action.payload;
      state = state
        .mergeDeep({ [pluginId]: { [installRemove]: { [installType]: [] } } })
         .updateIn([pluginId, installRemove, installType],
           steps => steps.push(Immutable.Map({ type })));
      state = state.updateIn([ pluginId, installRemove, installType ], steps => inheritFilesToCopySteps(steps));
      return state;
    }

    case FILE_LIST_FETCHED: {
      const { pluginId, installType, installRemove, url, files } = action.payload;
      const newSteps = state.getIn([pluginId, installRemove, installType], Immutable.List())
        .map(step => {
          if (step.get('type') === 'download' && step.get('url') === url) {
            return step.set('filesAvailable', files);
          }
          return step;
        });
      return state.setIn([ pluginId, installRemove, installType ], inheritFilesToCopySteps(newSteps));

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
    if (step.get('type') === 'download' && step.get('filesAvailable')) {
      currentFiles = mergeFiles(currentFiles, step.get('filesAvailable'))
    }

    if (step.get('type') === 'copy') {
      step = step.set('inheritedFiles', currentFiles)
    }
    return step;
  });
}

function mergeFiles(current, newFiles) {
  const newFilesMap = newFiles.reduce((filesMap, item) => {
    filesMap[item.name] = item;
    return filesMap;
  }, {});

  const resultingFileList = [].concat(newFiles);
  const currentInherited = current;
  currentInherited.forEach(file => {
    if (!newFilesMap[file.name]) {
      resultingFileList.push(file);
    }
  });
  return resultingFileList.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
}
