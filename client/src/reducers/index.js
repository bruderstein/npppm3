import { combineReducers } from 'redux';
import pluginList from './pluginList';
import pluginsLoaded from './pluginsLoaded';
import pluginsById from './pluginsById';


const rootReducer = combineReducers({
  pluginList,
  pluginsLoaded,
  pluginsById
});

export default rootReducer;