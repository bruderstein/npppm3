import React, { Component, PropTypes } from 'react';
import { FullRow, Row, Cell } from '../../Grid';
import File from './File';
import Immutable from 'immutable';
import styles from './steps.css'
import splitVariable from './splitVariable';

let uniqueId = 1;

export default class CopyStep extends Component {
  constructor(props) {
    super(props);
    this.onFromChange = this.onFromChange.bind(this);
    this.onToChange = this.onToChange.bind(this);
    this.onCheckChange = this.onCheckChange.bind(this);
    this.onToVariableChange = this.onToVariableChange.bind(this);
    this.uniqueId = 'download-step-' + uniqueId;
    const [ toVariable, toPath ] = splitVariable((props.step && props.step.get('to')) || '');
    this.state = {
      toVariable, toPath
    };
    uniqueId++;
  }

  componentWillReceiveProps(newProps) {
    const [ toVariable, toPath ] = splitVariable(newProps.step.get('to'));
    this.setState({
      toVariable, toPath
    });
  }

  onFromChange(e) {
    this.onTextChange('from', e);
  }

  onToChange(e) {
    this.props.onFieldChange('to', this.state.toVariable + e.target.value);
  }

  onToVariableChange(e) {
    this.props.onFieldChange('to', e.target.value + this.state.toPath);
  }

  onTextChange(field, e) {
    this.props.onFieldChange(field, e.target.value);
  }

  onCheckChange(field, e) {
    this.props.onFieldChange(field, e.checked);
  }

  render() {

    const { from, isDirectory, validate, backup } = this.props.step.toJS();
    const { toVariable, toPath } = this.state;
    const filesInherited = this.props.step.get('filesInherited') || Immutable.List()

    return (
      <fieldset className={styles.copyStep} id={this.uniqueId}>
        <label htmlFor={this.uniqueId}>Copy</label>
        <Row>
          <Cell small="12" large="2">
            From:
          </Cell>
          <Cell small="12" large="10">
            <input type="text" onChange={this.onFromChange} value={from} placeholder="Filespec from downloaded files - e.g. *.dll" />
          </Cell>
        </Row>
        <FullRow>
          <ul className={styles.filesList}>
            {filesInherited.map(file => <File file={file} />)}
          </ul>
        </FullRow>
        <Row>
          <Cell small="12" large="2">
            To:
          </Cell>
          <Cell small="12" large="4">
            <select defaultValue={toVariable} onChange={this.onToVariableChange}>
              <option value="$PLUGINDIR$">Plugin Directory</option>
              <option value="$NPPDIR$">Notepad++ Directory</option>
              <option value="$PLUGINCONFIGDIR$">Plugin Config Directory</option>
            </select>
          </Cell>
          <Cell small="12" large="6">
            <input type="text" onChange={this.onToChange} value={toPath} placeholder="Optional subdirectory or filename..."/>
          </Cell>
        </Row>
        <Row>
          <Cell small="12" large="4">
            <input type="checkbox" id={uniqueId + '-is-dir'} checked={isDirectory} />
            <label htmlFor={uniqueId + '-is-dir'}>Destination is directory</label>
          </Cell>
          <Cell small="12" large="4">
            <input type="checkbox" id={uniqueId + '-validate'} checked={validate} />
            <label htmlFor={uniqueId + '-validate'}>Validate</label>
          </Cell>
          <Cell small="12" large="4">
            <input type="checkbox" id={uniqueId + '-backup'} checked={backup} />
            <label htmlFor={uniqueId + '-backup'}>Backup old versions</label>
          </Cell>
        </Row>
      </fieldset>
    );
  }
}
