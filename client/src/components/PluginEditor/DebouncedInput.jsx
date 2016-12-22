
import React, { Component, PropTypes } from 'react';

export default class Debounce extends Component {

  constructor(props) {

    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {

    if (this.timer) {
      clearTimeout(this.timer);
    }
    const { target } = e;
    this.timer = setTimeout(() => this.props.onChange({ target }), 300);
  }

  render() {
    return <input
      {...this.props}
      type="text"
      onChange={this.onChange}
    />;
  }

}
