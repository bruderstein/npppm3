import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { fetchPluginList, pluginListSelector } from '../../data/pluginList';
import PluginListEntry from '../PluginListEntry/PluginListEntry';

import styles from './plugin-list.css';


class PluginList extends Component {

  constructor(props) {
    super(props);
    props.fetchPluginList();
  }
  
  render() {
    const { plugins } = this.props;
    if (!plugins) {
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
    plugins: pluginListSelector(state)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    fetchPluginList: () => dispatch(fetchPluginList())
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PluginList)
