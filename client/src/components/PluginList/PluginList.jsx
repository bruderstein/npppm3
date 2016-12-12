import React, { Component } from 'react';
import { connect } from 'react-redux';
import styles from './plugin-list.css';

import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';
import PluginListEntry from '../PluginListEntry/PluginListEntry';

class PluginList extends Component {
  
  render() {
    const { plugins, loaded } = this.props;
    if (!loaded) {
      return <LoadingIndicator />;
    }
    
    return (
      <div className={styles.wrapper}>
        <table>
          <tbody>
            {plugins.map(plugin => <PluginListEntry key={plugin.pluginId} plugin={plugin} />)}
          </tbody>
        </table>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    plugins: state.pluginList,
    loaded: state.pluginsLoaded
  };
}

export default connect(mapStateToProps)(PluginList)