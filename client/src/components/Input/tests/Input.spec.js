
import unexpectedReact from 'unexpected-react';
import unexpected from 'unexpected'
import React from 'react';
import TestUtils from 'react-addons-test-utils';

import Input from '../Input';

const expect = unexpected.clone().use(unexpectedReact);

describe('Input', function () {
  let renderer;
  beforeEach(function () {
    renderer = TestUtils.createRenderer();
  });

  it('renders an input', function () {
    renderer.render(<Input />);
    expect(renderer, 'to have rendered', <input />);
  });
});
