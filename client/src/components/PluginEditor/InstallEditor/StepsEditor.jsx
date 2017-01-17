import React, { Component, PropTypes } from 'react';
import AddStepButton from './AddStepButton';
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

  onAddStep(type) {
    const { onAddStep, pluginId, installRemove, installType } = this.props;
    // TODO: This will be a state change to show a dropdown, or we'll have the type as a parameter or something...
    onAddStep({ pluginId, installRemove, installType, type });
  }

  render () {
    const { steps } = this.props;
    return (
      <div>
        <ul className={styles.stepsEditor}>
          {steps.map((step, index) => <Step step={step} onFieldChange={this.onFieldChange} stepNumber={index} />)}
        </ul>
        <AddStepButton type="download" icon="fa-download" title="Add download step" onClick={this.onAddStep} />
        <AddStepButton type="copy" icon="fa-copy" title="Add copy step" onClick={this.onAddStep} />
        <AddStepButton type="run" icon="fa-run" title="Add run step" onClick={this.onAddStep} />
        <AddStepButton type="delete" icon="fa-delete" title="Add delete step" onClick={this.onAddStep} />
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
