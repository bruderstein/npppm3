import AuthenticatedApp from './AuthenticatedApp';
import { FullRow } from '../Grid';
import Header from '../Header/Header';
import Login from '../Login/Login';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { authSelector, checkAuthenticated } from '../../data/auth';

import styles from '../../styles.css';

class App extends Component {
  constructor(props) {
    super(props);
    props.checkAuthenticated();
  }

  render() {
    const { isAuthenticated } = this.props;
    return (
      <div className={styles.application}>
        <Header />
        <FullRow>
          { isAuthenticated ? <AuthenticatedApp /> : <Login />}
        </FullRow>
      </div>
    );
  }
}


function mapDispatchToProps(dispatch) {
  return {
    checkAuthenticated: () => dispatch(checkAuthenticated())
  };
}

function mapStateToProps(state) {
  return { isAuthenticated: authSelector(state).authenticated };
}

export default connect(mapStateToProps, mapDispatchToProps, null, { pure: false })(App);

