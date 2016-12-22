import React, { Component, PropTypes } from 'react';
import { Row, Cell } from '../Grid';
import InfoWrapper from './InfoWrapper';

let uniqueId = 1000;


export default function withFieldWrapper(WrappedComponent) {

  return class FieldWrapper extends Component {


    static propTypes = {
      labelSize: PropTypes.number,
      label: PropTypes.string.isRequired,
      docs: PropTypes.string
    }

    constructor(props) {
      super(props);
      this.uniqueId = uniqueId++;
    }

    render() {
      const { label, labelSize, docs, children, ...restProps } = this.props;

      return (
        <Row>
          <Cell large={labelSize || "2"} small="12">
            <label for={'field-wrapper-' + this.uniqueId}>{label}</label>
          </Cell>
          <Cell large={(labelSize && (12-labelSize)) || 10} small="12">
            <InfoWrapper docs={docs}>
              <WrappedComponent {...restProps} />
            </InfoWrapper>
          </Cell>
        </Row>
      );
    }
  };
}
