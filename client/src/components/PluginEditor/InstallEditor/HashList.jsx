import Hash from './Hash';
import React, { Component, PropTypes } from 'react';
import { hashSelector } from '../../../data/hashes';
import { connect } from 'react-redux';

class HashList extends Component {

  render() {
    const { hashes } = this.props;
    if (!hashes || hashes.size === 0) {
      return (
        <span>No file hashes are registered (add the hashes of the executable files you are copying)</span>
      );
    }

    return (
      <ul>
        {hashes.map((response, hash) => <Hash key={hash} hash={hash} response={response} />).toArray()}
      </ul>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    hashes: hashSelector(state, ownProps.pluginId)
  };
}
export { HashList as HashListPresentation };

export default connect(mapStateToProps)(HashList);
