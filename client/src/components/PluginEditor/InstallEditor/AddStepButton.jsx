import React, { Component, PropTypes } from 'react';

export default class AddStepButton extends Component {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    this.props.onAddStep(this.props.type)
  }

  render() {
    return (
      <button onClick={this.onClick} ><i className={'fa ' + this.props.icon} /></button>
    );
  }
}
