import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import DownloadStep from './DownloadStep';

const stepComponents = {
  download: DownloadStep
};

function UnknownStep({ step }) {
  return <div>Unknown step type "{step.get('type')}"</div>
}

export default class Step extends Component {
  constructor(props) {
    super(props);
    this.onFieldChange = this.onFieldChange.bind(this);
  }

  static propTypes = {
    stepNumber: PropTypes.number.required,
    step: PropTypes.instanceOf(Immutable.Map).required
  };

  onFieldChange(fieldName, value) {
    this.props.onFieldChange(this.props.stepNumber, fieldName, value);
  }

  render() {
    const { step } = this.props;
    const stepType = step.get('type');

    const StepComponent = stepComponents[stepType] || UnknownStep;

    return <StepComponent step={step} onFieldChange={this.onFieldChange}/>;
  }
}
