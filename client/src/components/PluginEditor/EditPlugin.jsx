import React, { Component } from 'react';
import { connect } from 'react-redux';
import styles from './plugin-editor.css';

import { savePlugin, fetchPlugin, fieldChanged } from '../../actions'

import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';
import PluginEditor from './PluginEditor';

class EditPlugin extends Component {

  constructor(props) {
    super(props);
    if (!props.plugin) {
      props.fetchPlugin();
    }
    this.onSave = this.onSave.bind(this);
  }

  onSave() {
    const { onSave, plugin } = this.props;
    onSave(plugin);
  }

  render() {
    const { plugin, onFieldChange } = this.props;

    if (!plugin) {
      return (
        <LoadingIndicator />
      );
    }

    return (
      <main>
        <PluginEditor plugin={plugin} onFieldChange={onFieldChange} />
        <button onClick={this.onSave}>Save</button>
      </main>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    plugin: state && state.pluginsById && state.pluginsById.get(ownProps.params.id)
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    fetchPlugin: () => dispatch(fetchPlugin(ownProps.params.id)),
    onFieldChange: (field, value) => dispatch(fieldChanged(ownProps.params.id, field, value)),
    onSave: (plugin) => dispatch(savePlugin(ownProps.params.id, plugin))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditPlugin)
