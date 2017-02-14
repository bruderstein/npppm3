import classnames from 'classnames';
import React from 'react';

import styles from './file.css';

export default function File({ name, highlighted, hash, validated, validationRequired }) {
  const classes = classnames({
    [styles.highlighted]: highlighted,
    [styles.validated]: validated,
    [styles.validationRequired]: validationRequired
  });

  return (
    <li className={classes}>{name}</li>
  )
}
