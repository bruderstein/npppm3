
import unexpectedReact from 'unexpected-react';
import unexpectedSinon from 'unexpected-sinon';
import unexpected from 'unexpected';

import React from 'react';
import TestUtils from 'react-addons-test-utils';

import withFieldWrapper from '../withFieldWrapper';

const expect = unexpected
  .clone()
  .use(unexpectedReact)
  .use(unexpectedSinon);

const SomeComponent = function (props) {
  return <div {...props}>SomeComponent</div>;
};

const Wrapped = withFieldWrapper(SomeComponent);

describe('withFieldWrapper', function () {

  let renderer;
  beforeEach(function () {
    renderer = TestUtils.createRenderer();
  });

  it('renders the wrapped component', function () {
    renderer.render(<Wrapped />);
    expect(renderer, 'to contain', <SomeComponent />);
  });

  it('renders the label with a unique id', function () {
    renderer.render(<Wrapped label="foo" />);
    expect(renderer, 'to contain', <label htmlFor={ expect.it('to match', /field-wrapper-[0-9]+/)}>foo</label>);
  });

  it('does not pass the label on to the wrapped component', function () {
    renderer.render(<Wrapped label="foo" bar="baz" />);
    expect(renderer, 'to contain exactly', <SomeComponent bar="baz" />);
  });


  // Docs button
});
