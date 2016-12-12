import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Match, Miss, Redirect } from 'react-router';
import { fetchPluginList } from '../../actions'
import styles from '../../styles.css';

import PluginList from '../PluginList/PluginList';
import PluginEditor from '../PluginEditor/PluginEditor';
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
        <Match pattern="/plugins/:id" component={PluginEditor} />
        <Miss render={ () => <Redirect to="/plugins" /> } />
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

