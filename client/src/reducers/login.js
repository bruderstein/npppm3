import { LOGGED_IN } from '../actions';

export default function login(state = {}, action) {
  switch(action.state) {
    case LOGGED_IN:
      return { isLoggedIn: true, ...action.payload };
    default:
      return state;
  }
}
