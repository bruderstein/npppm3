import React, { Component, PropTypes } from 'react';
import { fetchFileList } from '../../../data/pluginsById';

import File from './File';
import { FullRow, Row, Cell } from '../../Grid';
import { connect } from 'react-redux';
import styles from './steps.css'

let uniqueId = 1;

class DownloadStep extends Component {
  constructor(props) {
    super(props);
    this.state = { url: props.step.get('url') };
    this.onUrlChange = this.onUrlChange.bind(this);
    this.uniqueId = 'download-step-' + uniqueId;
    uniqueId++;
  }

  onUrlChange(e) {
    // TODO: do we need the url in the state as well? Only if we debounce the state change...
    this.setState({
      url: e.target.value
    });

    this.props.onFieldChange('url', e.target.value);
    if (this.urlChangeTimeout) {
      clearTimeout(this.urlChangeTimeout);
      this.urlChangeTimeout = null;
    }
    
    this.urlChangeTimeout = setTimeout(() => {
      this.props.fetchFileList(this.state.url);
    }, 500);
  }

  render() {

    const { url } = this.state;
    const { step } = this.props;
    const filesAvailable = step.get('$filesAvailable') || [];
    return (
      <fieldset className={styles.downloadStep} id={this.uniqueId}>
        <label htmlFor={this.uniqueId}>Download</label>
        <Row>
          <Cell small="12" large="2">
            URL:
          </Cell>
          <Cell small="12" large="10">
            <input type="text" onChange={this.onUrlChange} value={url} />
          </Cell>
        </Row>
        <FullRow>
          <ul className={styles.filesList}>
            {filesAvailable.map(file => <File {...file.toJS()} />)}
          </ul>
        </FullRow>
      </fieldset>
    );
  }
}

function mapDispatchToProps(dispatch, ownProps) {
  
  return {
    fetchFileList: (url) => {
      const { pluginId, installRemove, installType }  = ownProps;
      dispatch(fetchFileList({ pluginId: pluginId, installRemove, installType, url }))
    }
  };
}

export default connect(null, mapDispatchToProps)(DownloadStep);
