import React, { Component, PropTypes } from 'react';
import DebouncedInput from './DebouncedInput';
import withFieldWrapper from './withFieldWrapper';

class EditInput extends Component {

  constructor() {
    super();
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.props.onChange(this.props.field, e.target.value);
  }

  render() {

    const { plugin, field } = this.props;
    const value = plugin.get(field);
    return (
      <DebouncedInput onChange={this.onChange} initialValue={value} />
    );
  }
}

export default withFieldWrapper(EditInput);
