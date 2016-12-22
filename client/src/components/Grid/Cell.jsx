import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from './foundation.css';

export default function Cell({ small = 1, large = 1, span = null, children }) {
  if (span) {
    small = large = span;
  }
  return (
    <div className={classNames(styles.columns, styles['small-' + small], styles['large-' + large])}>
      {children}
    </div>
  );
}
