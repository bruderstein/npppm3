import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { installStepChange, installStepAdd } from '../../../actions';

import styles from './steps-editor.css';

import Step from './Step';

class StepsEditor extends Component {

  constructor() {
    super();
    this.onFieldChange = this.onFieldChange.bind(this);
    this.onAddStep = this.onAddStep.bind(this);
  }

  static propTypes = {
    pluginId: PropTypes.string,
    installType: PropTypes.string,
    onFieldChange: PropTypes.func
  };

  onFieldChange(stepNumber, field, value) {
    const { onFieldChange, pluginId, installRemove, installType } = this.props;
    onFieldChange({ pluginId, installRemove, installType, stepNumber, field, value })
  }

  onAddStep() {
    const { onAddStep, pluginId, installRemove, installType } = this.props;
    // TODO: This will be a state change to show a dropdown, or we'll have the type as a parameter or something...
    onAddStep({ pluginId, installRemove, installType, type: 'download' });
  }

  render () {
    const { steps } = this.props;
    return (
      <div>
        <ul className={styles.stepsEditor}>
          {steps.map((step, index) => <Step step={step} onFieldChange={this.onFieldChange} stepNumber={index} />)}
        </ul>
        <button onClick={this.onAddStep}>Add Step</button>
      </div>
    );

  }
}

function mapDispatchToProps(dispatch) {
  return {
    onFieldChange(args) {
      dispatch(installStepChange(args));
    },
    onAddStep(args) {
      dispatch(installStepAdd(args));
    }
  };
}

export default connect(null, mapDispatchToProps)(StepsEditor);
