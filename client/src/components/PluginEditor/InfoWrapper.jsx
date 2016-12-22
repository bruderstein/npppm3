import React from 'react';

import styles from './info-wrapper.css';

export default function InfoWrapper({docs, children}) {
  return (
    <div className={styles.infoWrapper}>
      <div className={styles.shrink}>
        {children}
      </div>
      <button>[I]</button>
    </div>
  )
}
