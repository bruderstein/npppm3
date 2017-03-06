import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

import styles from '../../styles.css';

import EditPlugin from '../PluginEditor/EditPlugin';
import { FullRow } from '../Grid';
import NewPlugin from '../PluginEditor/NewPlugin';
import PluginList from '../PluginList/PluginList';

export default class AuthenticatedApp extends Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate() {
    return true;
  }

  render() {
    return (
      <Switch>
        <Route path="/plugins" exact component={PluginList} />
        <Route path="/plugins/new" exact component={NewPlugin} />
        <Route path="/plugins/:id" component={EditPlugin} />
        <Redirect to="/plugins" />
      </Switch>
    );
  }
}

