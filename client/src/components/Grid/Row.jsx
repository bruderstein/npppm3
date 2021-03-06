import React, { Component, PropTypes } from 'react';

import styles from './foundation.css';

export default function Row({ children }) {
  return (<div className={styles.row}>{children}</div>);
}
