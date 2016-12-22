import React, { Component } from 'react';
import { connect } from 'react-redux';
import styles from './plugin-editor.css';

import { fetchPlugin, fieldChanged } from '../../actions'

import PluginEditor from './PluginEditor';

class EditPlugin extends Component {

  constructor(props) {
    super(props);
    if (!props.plugin) {
      props.fetchPlugin();
    }
  }

  render() {
    const { plugin, onFieldChange } = this.props;

    return (
      <PluginEditor plugin={plugin} onFieldChange={onFieldChange} />
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
    fetchPlugin: () => dispatch(fetchPlugin(ownProps.params.id)),
    onFieldChange: (field, value) => dispatch(fieldChanged(ownProps.params.id, field, value))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditPlugin)
