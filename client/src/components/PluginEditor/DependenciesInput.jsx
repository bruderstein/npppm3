import React, { Component, PropTypes } from 'react';
import withFieldWrapper from './withFieldWrapper';

class DependenciesInput extends Component {

  constructor() {
    super();
  }

  render() {

    return (
      <div>
        ** Dependencies Input (TODO: react-select)**
      </div>
    );
  }
}

export default withFieldWrapper(DependenciesInput);
