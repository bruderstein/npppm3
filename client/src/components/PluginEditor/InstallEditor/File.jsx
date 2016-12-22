import classnames from 'classnames';
import React from 'react';

import styles from './file.css';

export default function File({ name, highlight, hash, validated, validationRequired }) {
  const classes = classnames({
    [styles.highlight]: highlight,
    [styles.validated]: validated,
    [styles.validationRequired]: validationRequired
  });

  return (
    <li className={classes}>{name}</li>
  )
}
