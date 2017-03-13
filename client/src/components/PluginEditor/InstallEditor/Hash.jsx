import React from 'react';
import classnames from 'classnames';

import styles from './hashes.css';

export default function Hash({ hash, response }) {
  const classes = classnames({
    [styles.responseOk]: response === 'ok',
    [styles.responseBad]: response === 'bad'
  });
  return (
    <li className={classes}>{hash}</li>
  );
}
