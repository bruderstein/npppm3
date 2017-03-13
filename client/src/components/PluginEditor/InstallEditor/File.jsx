import classnames from 'classnames';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addHash } from '../../../data/pluginsById';

import styles from './file.css';

class File extends Component {

  constructor() {
    super();
    this.addHash = this.addHash.bind(this);
  }

  addHash() {
    // For now, just add 'ok'. We'd like to be able to add 'bad' as well at some point.
    this.props.addHash('ok');
  }

  render() {
    const { name, highlighted, md5, validated, hashRegistered } = this.props;
    const classes = classnames({
      [styles.highlighted]: highlighted,
      [styles.validated]: validated,
      [styles.validationRequired]: hashRegistered === null,
      [styles.validationOk]: hashRegistered === 'ok',
      [styles.validationBad]: hashRegistered === 'bad',
    });

    let addHashButton = null;

    if (highlighted && validated && !hashRegistered) {
      addHashButton = <button onClick={this.addHash}>Approve {md5}</button>
    }

    return (
      <li className={classes}>{name} {addHashButton}</li>
    );
  }
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    addHash: (response) => dispatch(addHash(ownProps.pluginId, ownProps.md5, response))
  };
}

export default connect(null, mapDispatchToProps)(File);
