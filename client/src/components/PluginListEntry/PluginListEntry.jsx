import React, { Component } from 'react';
import styles from './plugin-list-entry.css';
import { Link } from 'react-router';

export default class PluginListEntry extends Component {
  
  shouldComponentUpdate(nextProps) {
    return nextProps.plugin !== this.props.plugin;
  }
  
  render() {
    const { plugin } = this.props;
    return (
      <tr>
        <td className={styles.name}><Link to={'/plugins/' + plugin.pluginId}>{plugin.name}</Link></td>
        <td className={styles.version}>{plugin.unicodeVersion}</td>
      </tr>
    );
  }
}
