import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Match, Miss, Redirect } from 'react-router';
import { fetchPluginList } from '../../actions'
import styles from '../../styles.css';

import PluginList from '../PluginList/PluginList';
import EditPlugin from '../PluginEditor/EditPlugin';
import NewPlugin from '../PluginEditor/NewPlugin';
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
        <Miss render={ () => {
          return (<div>
            <Match pattern="/plugins/:id" component={EditPlugin} />
            <Miss render={() => <Redirect to="/plugins" />} />
          </div>);
        } } />
      </Row>
    );
  }
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

