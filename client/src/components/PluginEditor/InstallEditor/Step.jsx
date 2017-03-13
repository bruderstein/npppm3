import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import DownloadStep from './DownloadStep';
import CopyStep from './CopyStep';


const stepComponents = {
  download: DownloadStep,
  copy: CopyStep
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
    stepNumber: PropTypes.number.isRequired,
    step: PropTypes.instanceOf(Immutable.Map).isRequired
  };

  onFieldChange(fieldName, value) {
    this.props.onFieldChange({
      stepNumber: this.props.stepNumber,
      field: fieldName,
      value: value
    });
  }

  render() {
    const { step, pluginId, ...restProps } = this.props;
    const stepType = step.get('type');

    const StepComponent = stepComponents[stepType] || UnknownStep;

    return <StepComponent {...restProps} pluginId={pluginId} step={step} onFieldChange={this.onFieldChange} />;
  }
}
