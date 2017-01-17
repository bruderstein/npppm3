import React, { Component, PropTypes } from 'react';
import { FullRow, Row, Cell } from '../../Grid';
import splitVariable from './splitVariable';
import File from './File';
import styles from './steps.css'

let uniqueId = 1;

export default class DeleteStep extends Component {

  constructor(props) {
    super(props);
    this.uniqueId = 'delete-step-' + uniqueId;
    const [ pathVariable, path ] = splitVariable((props.step && props.step.get('path')) || '');
    this.state = {
      pathVariable, path
    };
    uniqueId++;
    this.onPathChange = this.onPathChange.bind(this);
    this.onPathVariableChange = this.onPathVariableChange.bind(this);
  }

  componentWillReceiveProps(newProps) {
    const [ pathVariable, path ] = newProps.step.get('path');
    this.setState({
      pathVariable, path
    });
  }

  onPathChange(e) {
    this.props.onFieldChange('path', this.state.pathVariable + e.target.value);
  }

  onPathVariableChange(e) {
    this.props.onFieldChange('path', e.target.value + this.state.path);
  }

  render() {
    const { path, pathVariable } = this.state;
    return (
      <fieldset className={styles.downloadStep} id={this.uniqueId}>
        <label htmlFor={this.uniqueId}>Delete</label>
        <Row>
          <Cell small="12" large="2">
            Path:
          </Cell>
          <Cell small="12" large="4">
            <select defaultValue={pathVariable} onChange={this.onPathVariableChange}>
              <option value="$PLUGINDIR$">Plugin Directory</option>
              <option value="$NPPDIR$">Notepad++ Directory</option>
              <option value="$PLUGINCONFIGDIR$">Plugin Config Directory</option>
            </select>
          </Cell>
          <Cell small="12" large="6">
            <input type="text" onChange={this.onPathChange} value={path} placeholder="Path of file to delete... "/>
          </Cell>
        </Row>
      </fieldset>
    );
  }
}
