import { PLUGIN_LIST_FETCHED } from '../actions';

export default function pluginList(state = [], action) {
  switch (action.type) {
    case PLUGIN_LIST_FETCHED:
      return action.response.plugins;
    default:
      return state;
  }
}