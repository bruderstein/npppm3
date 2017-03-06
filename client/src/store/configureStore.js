import { compose, createStore, applyMiddleware } from 'redux';
import reducer from '../reducers';
import reduxPromise from 'redux-promise';


export default function configureStore(initialState) {
  
  const middlewares = [reduxPromise];
  
  if (process.env.NODE_ENV !== 'production') {
    const createLogger = require('redux-logger');
    const logger = createLogger();
    middlewares.push(logger);
  }
  
  const store = createStore(
    reducer,
    compose(applyMiddleware(...middlewares))
  );
  
  if (process.env.NODE_ENV !== 'production' && module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers/index');
      store.replaceReducer(nextReducer);
    });
  }
  
  return store;
}
