import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createNewPlugin, fieldChanged, saveNewPlugin } from '../../data/pluginsById';
import PluginEditor from './PluginEditor';

class NewPlugin extends Component {

  constructor(props) {
    super(props);
    if (!props.plugin) {
      props.createNewPlugin();
    }
    this.onSave = this.onSave.bind(this);
  }

  onSave() {
    this.props.saveNewPlugin(this.props.plugin);
  }

  render() {
    const { plugin, onFieldChange } = this.props;

    if (!plugin) {
      return <div/>;
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
    plugin: state && state.pluginsById && state.pluginsById.get('new')
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    createNewPlugin: () => dispatch(createNewPlugin()),
    onFieldChange: (field, value) => dispatch(fieldChanged('new', field, value)),
    saveNewPlugin: (plugin) => dispatch(saveNewPlugin(plugin))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewPlugin)
