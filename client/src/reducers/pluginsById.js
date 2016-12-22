
import {
  PLUGIN_FETCHED, PLUGIN_CREATED, PLUGIN_FIELD_CHANGED, PLUGIN_SAVED,
  FILES_FETCHED_FOR_DOWNLOAD
} from '../actions';

import Immutable from 'immutable';

export default function pluginsById(state = Immutable.Map(), action) {
  switch (action.type) {
    case PLUGIN_FETCHED:
      return state.set(action.response.pluginId, Immutable.fromJS(action.response));

    case PLUGIN_CREATED:
      return state.set('new', Immutable.fromJS({ aliases: [] }));

    case PLUGIN_FIELD_CHANGED:
      const { pluginId, field, value } = action.payload;
      return state.setIn([pluginId, field], value);

    case FILES_FETCHED_FOR_DOWNLOAD:

      const { pluginId, installType, url, files } = action.payload;
      const newSteps = state.getIn([pluginId, 'install', installType])
        .map(step => {
          if (step.get('type') === 'download' && step.get('url') === url) {
            return step.set('filesAvailable', files);
          }
          return step;
        });

      return state.setIn([pluginId, 'install', installType], newSteps);

    case PLUGIN_SAVED:
      const { response } = action.payload;
      if (response.statusCode === 200 || response.statusCode === 201) {
        return state.set(response.pluginId, Immutable.fromJS(response));
      }
      return state;
    default:
      return state;
  }
}
