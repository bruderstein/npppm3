
import { registerReducer } from '../store';
import { fetchJson } from '../lib/fetch';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action typs
const LOGGED_IN = 'npppm/auth/LOGGED_IN';
const LOGIN_FAILED = 'npppm/auth/LOGIN_FAILED';
const AUTHENTICATION_REQUIRED = 'npppm/auth/AUTHENTICATION_REQUIRED';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Actions

export const login = function login(email, password) {

  return fetchJson('/api/auth/signin', {
    method: 'POST',
    body: { email, password },
    credentials: 'include'
  }).then(response => {
    if (response.status === 200) {

      return {
        type: LOGGED_IN,
        payload: {
          email: response.payload.email,
          name: response.payload.name
        }
      };
    }
    return {
      type: LOGIN_FAILED,
      payload: {
        email: email
      }
    };
  });
};

export const checkAuthenticated = function checkAuthenticated() {
  return fetchJson('/api/auth')
    .then(response => {
      if (response.status === 200) {
        return {
          type: LOGGED_IN,
          payload: response.payload
        }
      }
      if (response.status === 401) {
        return {
          type: AUTHENTICATION_REQUIRED
        };
      }

      // TODO: Maybe a FETCH_ERROR here?
      return {
        type: AUTHENTICATION_REQUIRED,
        payload: {
          status: response.status
        }
      };
    });
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Reducer


const authReducer = function (state = { authenticated: null }, action) {
  switch(action.type) {
    case LOGGED_IN:
      return { authenticated: true, credentials: action.payload.credentials };

    case LOGIN_FAILED:
      return { authenticated: false };

    case AUTHENTICATION_REQUIRED:
      return { authenticated: false };

    default:
      return state;
  }
};


registerReducer('auth', authReducer);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Selector

export const authSelector = (state) => state.auth;

