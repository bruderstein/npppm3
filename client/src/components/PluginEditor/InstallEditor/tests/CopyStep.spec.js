
import unexpectedReact from 'unexpected-react';
import Immutable from 'immutable';
import CopyStep from '../CopyStep';
import File from '../File'
import React from 'react';
import sinon from 'sinon';
import TestUtils from 'react-addons-test-utils';

import unexpected from 'unexpected';
import unexpectedSinon from 'unexpected-sinon';

const expect = unexpected
  .clone()
  .use(unexpectedReact)
  .use(unexpectedSinon);

describe('CopyStep', function () {
  let renderer;

  beforeEach(function () {
    renderer = TestUtils.createRenderer();
  });

  it('renders the `from` field', function () {
    const step = Immutable.fromJS({
      type: 'copy',
      from: 'footest.dll'
    });

    renderer.render(<CopyStep step={step} />);
    expect(renderer, 'to contain', <input type="text" value="footest.dll" />);
  });

  it('renders the `to` field', function () {
    const step = Immutable.fromJS({
      type: 'copy',
      to: '$PLUGINDIR$footest.dll'
    });

    renderer.render(<CopyStep step={step} />);
    expect(renderer, 'to contain', <input type="text" value="footest.dll" />);
  });

  it('sets the correct variable for the to prefix for the default prefix', function () {
    const step = Immutable.fromJS({
      type: 'copy',
      to: '$PLUGINDIR$footest.dll'
    });

    renderer.render(<CopyStep step={step} />);
    expect(renderer, 'to contain', <select defaultValue="$PLUGINDIR$" />);
  });

  it('sets the correct variable for the to prefix for a different prefix', function () {
    const step = Immutable.fromJS({
      type: 'copy',
      to: '$NPPDIR$footest.dll'
    });

    renderer.render(<CopyStep step={step} />);
    expect(renderer, 'to contain', <select defaultValue="$NPPDIR$" />)
  });

  it('sets the variable to the default if no known variable is found', function () {
    const step = Immutable.fromJS({
      type: 'copy',
      to: '$HACKED$footest.dll'
    });

    renderer.render(<CopyStep step={step} />);
    expect(renderer, 'to contain', <select defaultValue="$PLUGINDIR$" />);
  });

  it('renders the inherited files', function () {

    const step = Immutable.fromJS({
      type: 'copy',
      filesInherited: [ { name: 'foo.dll' }, { name: 'bar/foo.dll' } ]
    });

    renderer.render(<CopyStep step={step} />);
    expect(renderer, 'to contain',
      <ul>
        <File file={step.getIn(['filesInherited', 0])} />
        <File file={step.getIn(['filesInherited', 1])} />
      </ul>);
  });

  it('calls the onFieldChange callback with the variable when the `to` input is changed', function () {
    const step = Immutable.fromJS({
      type: 'copy',
      to: '$PLUGINDIR$foo.dll'
    });

    const spy = sinon.spy();
    renderer.render(<CopyStep step={step} onFieldChange={spy} />);
    return expect(renderer, 'with event change', { target: { value: 'foobar.dll' } },
      'on', <input value="foo.dll" />)
      .then(() => {
      expect(spy, 'to have calls satisfying', [ [ 'to', '$PLUGINDIR$foobar.dll'] ]);
    });
  });

  it('calls the onFieldChange callback with the variable when the `to` variable select is changed', function () {
    const step = Immutable.fromJS({
      type: 'copy',
      to: '$PLUGINDIR$foo.dll'
    });

    const spy = sinon.spy();
    renderer.render(<CopyStep step={step} onFieldChange={spy} />);
    return expect(renderer, 'with event change', { target: { value: '$NPPDIR$' } },
      'on', <select />)
      .then(() => {
      expect(spy, 'to have calls satisfying', [ [ 'to', '$NPPDIR$foo.dll'] ]);
    });
  });

});
