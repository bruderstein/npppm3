import React, { Component, PropTypes } from 'react';

import { FullRow, Row, Cell } from '../../Grid';

export default class InstallEditor extends Component {

  render() {
    const { showANSI, installSteps } = this.props;

    return (
      <FullRow>
        { showANSI &&
          <StepsEditor label="ANSI (x86) Install Steps"
                       steps={installSteps.get('ansi') || Immutable.List()}
          />
        }
        <StepsEditor label="Unicode (x86) Install Steps"
                     steps={installSteps.get('unicode') || Immutable.List()}
        />
        <StepsEditor label="x64 Install Steps"
                     steps={installSteps.get('x64') || Immutable.List()}
        />
      </FullRow>
    )
  }
}
