import React, { Component } from 'react';
import { connect } from 'react-redux';
import styles from './plugin-editor.css';

import { fetchPlugin } from '../../actions'

import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';

class PluginEditor extends Component {
  
  constructor(props) {
    super(props);
    if (!props.plugin) {
      props.fetchPlugin();
      this.state = {};
    } else {
      this.state = {name: props.plugin.definition.name};
    }
    // This is just a sample to check things are working.
    // These inputs need to be their own components and manage their own debouncing of state changes etc.
    // Be nice to have a middleware on state changes that saves the plugin edit state in localstorage :)
    this.onChange = this.onChange.bind(this);
  }
  
  componentWillReceiveProps(newProps) {
    // Cheating, but need to move this anyway
    this.setState({
      name: newProps.plugin.definition.name
    });
  }
  
  onChange(e) {
    this.setState({
      name: e.target.value
    });
  }
  
  render() {
    const { plugin } = this.props;
    if (!plugin) {
      return <LoadingIndicator />;
    }
    
    return (
      <div className={styles.wrapper}>
        <input type="text" onChange={this.onChange} value={this.state.name} />
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    plugin: state && state.pluginsById && state.pluginsById[ownProps.params.id]
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    fetchPlugin: () => dispatch(fetchPlugin(ownProps.params.id))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PluginEditor)
