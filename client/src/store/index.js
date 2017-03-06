import { compose, createStore, applyMiddleware, combineReducers } from 'redux';
import reduxPromise from 'redux-promise';

const middlewares = [reduxPromise];

if (process.env.NODE_ENV !== 'production') {
  const createLogger = require('redux-logger');
  const logger = createLogger();
  middlewares.push(logger);
}

const reducer = () => ({});
const reducers = {};

const store = createStore(
  reducer,
  compose(applyMiddleware(...middlewares))
);

if (process.env.NODE_ENV !== 'production' && module.hot) {
  // Enable Webpack hot module replacement for reducers
  /*
  module.hot.accept('../reducers', () => {
    const nextReducer = require('../reducers/index');
    store.replaceReducer(nextReducer);
  });
  */
}

export function registerReducer(name, reducer) {
  reducers[name] = reducer;
  store.replaceReducer(combineReducers(reducers));
}

export default store;
