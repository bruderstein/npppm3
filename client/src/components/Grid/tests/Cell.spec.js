
import unexpectedReact from 'unexpected-react';
import unexpectedSinon from 'unexpected-sinon';
import unexpected from 'unexpected';

import Sinon from 'sinon';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import Cell from '../Cell';

const expect = unexpected
  .clone()
  .use(unexpectedReact)
  .use(unexpectedSinon);

describe('Cell', function () {

  let renderer;
  beforeEach(function () {
    renderer = TestUtils.createRenderer();
  });

  it('renders a default cell', function () {

    renderer.render(<Cell />);
    expect(renderer, 'to have rendered', <div className="columns small-1 large-1" />);
  });

  it('uses the `span` prop to populate both', function () {
    renderer.render(<Cell span="3" />);
    expect(renderer, 'to have rendered', <div className="columns small-3 large-3" />);
  });

  it('renders the different sizes', function () {

    renderer.render(<Cell large="3" small="6" />);
    expect(renderer, 'to have rendered', <div className="columns large-3 small-6" />);
  });

  it('renders the children', function () {
    renderer.render(<Cell>Content</Cell>);
    expect(renderer, 'to have rendered', <div className="columns">Content</div>);
  });
});
