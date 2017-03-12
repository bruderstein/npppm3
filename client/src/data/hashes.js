import Immutable from 'immutable';
import { registerReducer } from '../store';
import { PLUGIN_FETCHED } from './pluginsById';

export { PLUGIN_FETCHED };

//////////////////////////////////////////////////////////
// Reducer

const hashReducer = function (state = Immutable.Map(), action) {
  switch(action.type) {
    case PLUGIN_FETCHED: {
      const { pluginId, hashes } = action.payload;
      return state.set(pluginId, Immutable.fromJS(hashes));
    }
  }
  return state;
};

export { hashReducer };

registerReducer('hashes', hashReducer);


//////////////////////////////////////////////////////////
// Selector

const hashSelector = function (state, pluginId) {
  return state.hashes.get(pluginId) || Immutable.Map();
};

export { hashSelector };

