
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
      return state
        .mergeDeep({ [pluginId]: { [installRemove]: { [installType]: [] } } })
         .updateIn([pluginId, installRemove, installType],
           steps => steps.push(Immutable.Map({ type })));
    }

    case FILE_LIST_FETCHED: {
      const { pluginId, installType, url, files } = action.payload;
      const newSteps = state.getIn([pluginId, 'install', installType])
        .map(step => {
          if (step.get('type') === 'download' && step.get('url') === url) {
            return step.set('filesAvailable', files);
          }
          return step;
        });

      return state.setIn([pluginId, 'install', installType], newSteps);
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
