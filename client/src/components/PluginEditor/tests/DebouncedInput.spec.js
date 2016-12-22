
import unexpectedReact from 'unexpected-react';
import unexpectedSinon from 'unexpected-sinon';
import unexpected from 'unexpected';

import Sinon from 'sinon';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import DebouncedInput from '../DebouncedInput';

const expect = unexpected
  .clone()
  .use(unexpectedReact)
  .use(unexpectedSinon);

describe('DebouncedInput', function () {

  let renderer;
  let timers;
  beforeEach(function () {
    renderer = TestUtils.createRenderer();
    timers = Sinon.useFakeTimers()
  });

  afterEach(function () {
    timers.restore();
  });

  it('renders an input', function () {
    renderer.render(<DebouncedInput />);
    expect(renderer, 'to have rendered', <input />);
  });

  it('passes through the defaultValue', function () {

    renderer.render(<DebouncedInput defaultValue="foo"/>);
    expect(renderer, 'to have rendered', <input defaultValue="foo" />);
  });

  it('does not call onChange immediately', function () {
    const onChange = Sinon.spy();
    renderer.render(<DebouncedInput onChange={onChange} />);
    return expect(renderer, 'with event change', {}, 'on', <input />)
      .then(() => {
        expect(onChange, 'was not called');
      });
  });

  it('calls onChange after 300ms', function () {
    const onChange = Sinon.spy();
    renderer.render(<DebouncedInput onChange={onChange} />);
    return expect(renderer, 'with event change', { target: { value: 'foo' } }, 'on', <input />)
      .then(() => {
        timers.tick(300);
        expect(onChange, 'to have calls satisfying', [ [ { target: { value: 'foo' } }]]);
      });
  });

  it('changing `defaultValue` after rendering does nothing', function () {
    const onChange = Sinon.spy();
    const div = document.createElement('div');
    const component = ReactDOM.render(<DebouncedInput defaultValue="foo" onChange={onChange} />, div);
    ReactDOM.render(<DebouncedInput defaultValue="bar" onChange={onChange} />, div);

    return expect(component, 'queried for', <input />).then(input => {
      expect(input.value, 'to equal', 'foo')
    });

  });
});
