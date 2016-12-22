import React, { Component, PropTypes } from 'react';
import withFieldWrapper from './withFieldWrapper';
import styles from './alias-input.css';

class AliasInput extends Component {

  constructor() {
    super();
    this.state = { inputValue: '' };
    this.onInputChange = this.onInputChange.bind(this);
    this.onAddNew = this.onAddNew.bind(this);
  }

  onInputChange(e) {
    this.setState({
      inputValue: e.target.value
    });
  }

  onAddNew() {
    if (this.state.inputValue) {
      this.props.onFieldChange('aliases', this.props.aliases.push(this.state.inputValue));
    }
  }

  render() {

    return (
      <div className={styles.aliasInput}>
        <ul>
          {this.props.aliases.map(alias =>
            <li key={alias}>{alias}</li>).toArray()
          }
        </ul>
        <div className={styles.new}>
          <input onChange={this.onInputChange}
                 value={this.state.inputValue}
                 placeholder="Enter another alias..."
          />
          <button onClick={this.onAddNew}>Add alias</button>
        </div>
      </div>
    );
  }
}

export default withFieldWrapper(AliasInput);
