import unexpectedReact from 'unexpected-react';
import Immutable from 'immutable';
import Hash from '../Hash';
import { HashListPresentation } from '../HashList';
import React from 'react';

import unexpected from 'unexpected';

const expect = unexpected
  .clone()
  .use(unexpectedReact);

describe('HashList', function () {
  it('renders a single hash', function () {
    expect(
      <HashListPresentation hashes={Immutable.fromJS({ '1111222233334444': 'ok' })}/>,
      'to render as',
      <ul>
        <Hash hash="1111222233334444" response="ok" />
      </ul>
    );
  });

  it('renders a multiple hashes', function () {
    expect(
      <HashListPresentation hashes={Immutable.fromJS({
        '1111222233334444': 'ok',
        '1111222233335555': 'bad',
      })}/>,
      'to render with all children as',
      <ul>
        <Hash hash="1111222233334444" response="ok" />
        <Hash hash="1111222233335555" response="bad" />
      </ul>
    );
  });

  it('renders no hashes with just a message', function () {
    expect(
      <HashListPresentation hashes={Immutable.Map()} />,
      'to render as',
      <span>No file hashes are registered (add the hashes of the executable files you are copying)</span>
    );
  });
});

