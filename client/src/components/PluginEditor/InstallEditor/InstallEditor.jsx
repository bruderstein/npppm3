import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import StepsEditor from './StepsEditor';
import { FullRow, Row, Cell } from '../../Grid';

export default class InstallEditor extends Component {

  constructor() {
    super();

  }

  render() {
    const { showANSI, installSteps, installRemove, pluginId } = this.props;

    return (
      <FullRow>
        { showANSI &&
          <StepsEditor label="ANSI (x86) Install Steps"
                       steps={installSteps.get('ansi') || Immutable.List()}
                       pluginId={pluginId}
                       installRemove={installRemove}
                       installType="ansi"
          />
        }
        <StepsEditor label="Unicode (x86) Install Steps"
                     steps={installSteps.get('unicode') || Immutable.List()}
                     pluginId={pluginId}
                     installRemove={installRemove}
                     installType="unicode"
        />
        <StepsEditor label="x64 Install Steps"
                     steps={installSteps.get('x64') || Immutable.List()}
                     pluginId={pluginId}
                     installRemove={installRemove}
                     installType="x64"
        />
      </FullRow>
    )
  }
}
