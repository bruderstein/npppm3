
import { PLUGIN_LIST_FETCHED } from '../actions';

export default function pluginsLoaded(state = false, action) {
  switch (action.type) {
    case PLUGIN_LIST_FETCHED:
      return true;
    default:
      return state;
  }
}
