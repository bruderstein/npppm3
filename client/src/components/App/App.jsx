import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Match, Miss, Redirect } from 'react-router';
import { fetchPluginList } from '../../actions'
import styles from '../../styles.css';

import PluginList from '../PluginList/PluginList';
import EditPlugin from '../PluginEditor/EditPlugin';
import NewPlugin from '../PluginEditor/NewPlugin';
import Login from '../Login/Login';
import Row from '../Grid/Row';

class App extends Component {
  constructor(props) {
    super(props);
    props.fetchPluginList();
  }
  
  render() {
    return (
      <Row>
        <Match pattern="/plugins" exactly component={PluginList} />
        <Match pattern="/plugins/new" exactly component={NewPlugin} />
        <Match pattern="/login" exactly component={Login} />
        <Match pattern="/plugins/:id" render={props => {
          if (props.params.id === 'new') {
            return <NewPlugin />;
          }
          return <EditPlugin {...props} />;
        }} />
        <Miss component={NoMatch} />
      </Row>
    );
  }
}

function NoMatch() {
  return (
    <div>
      <span>Nothing matched!</span>
    </div>
  );
}

function mapDispatchToProps(dispatch) {
  return {
    fetchPluginList: () => dispatch(fetchPluginList())
  };
}

function mapStateToProps(state) {
  return { pluginsLoaded: state.pluginsLoaded };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);

