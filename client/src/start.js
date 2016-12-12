import App from './components/App/App';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { AppContainer } from 'react-hot-loader';

import store from './store';

ReactDOM.render(
        <AppContainer>
          <Provider store={store}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </Provider>
        </AppContainer>, document.getElementById('app-container'));

if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./components/App/App', () => {
    const NextApp = require('./components/App/App').default;
    ReactDOM.render(
      <AppContainer>
        <Provider store={store}>
          <BrowserRouter>
            <NextApp/>
          </BrowserRouter>
        </Provider>
      </AppContainer>,
      document.getElementById('app-container')
    );
  });
}

