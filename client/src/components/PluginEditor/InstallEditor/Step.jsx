import React, { Component, PropTypes } from 'react';
import DownloadStep from './DownloadStep';

const stepComponents = {
  download: DownloadStep
};

function UnknownStep({ step }) {
  return <div>Unknown step type "{step.get('type')}"</div>
}

export function Step({ step }) {
  const stepType = step.get('type'); // TODO: need to check the definition of the steps for this

  const StepComponent = stepComponents[stepType] || UnknownStep;

  return <StepComponent step={step} />;
}
