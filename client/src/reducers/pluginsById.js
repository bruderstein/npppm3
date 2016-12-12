
import { PLUGIN_FETCHED } from '../actions';

export default function pluginsById(state = {}, action) {
  switch (action.type) {
    case PLUGIN_FETCHED:
      console.log('PLUGIN_FETCHED', action);
      return { [action.response.pluginId]: action.response, ...state };
    default:
      return state;
  }
}
