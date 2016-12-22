import React, { Component, PropTypes } from 'react';

import Step from './Step';

export default class StepsEditor extends Component {


  render () {

    const { steps } = this.props;
    return (
      <ul className={styles.stepsEditor}>
        {steps.map(step => <Step step={step} />)}
      </ul>
    );
  }
}
