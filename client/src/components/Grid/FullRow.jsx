import React, { Component, PropTypes } from 'react';

import Cell from './Cell';
import Row from './Row';

import styles from './foundation.css';

export default function FullRow({ children }) {

  return (
    <Row>
      <Cell large="12" small="12">
      {children}
      </Cell>
    </Row>
  );
}
