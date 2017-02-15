
import {
  PLUGIN_FETCHED, PLUGIN_CREATED, PLUGIN_FIELD_CHANGED,
  INSTALL_STEP_FIELD_CHANGED, INSTALL_STEP_ADD,
  PLUGIN_SAVED, FILE_LIST_FETCHED
} from '../actions';

import Immutable from 'immutable';
import minimatch from 'minimatch';

export default function pluginsById(state = Immutable.Map(), action) {
  switch (action.type) {
    case PLUGIN_FETCHED:
      return state.set(action.response.pluginId, Immutable.fromJS(action.response));

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
        return step.set(field, value)
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
      currentFiles = mergeFiles(currentFiles, step.get('$filesAvailable'))
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
