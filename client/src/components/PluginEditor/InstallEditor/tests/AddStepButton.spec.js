import unexpectedReact from 'unexpected-react';
import React from 'react';
import sinon from 'sinon';
import TestUtils from 'react-addons-test-utils';

import AddStepButton from '../AddStepButton';
import unexpected from 'unexpected';
import unexpectedSinon from 'unexpected-sinon';

const expect = unexpected
  .clone()
  .use(unexpectedReact)
  .use(unexpectedSinon);

describe('AddStepButton', function () {

  let renderer;

  beforeEach(function () {
    renderer = TestUtils.createRenderer();
  });

  it('renders the button', function () {
    renderer.render(<AddStepButton icon="fa-add" />);
    expect(renderer, 'to have rendered',
      <button><i className="fa-add" /></button>
    );
  });

  it('calls onAddStep with the type', function () {
    const spy = sinon.spy();
    renderer.render(<AddStepButton icon="fa-add" type="add" onAddStep={spy} />);
    return expect(renderer, 'with event', 'click')
      .then(() => {
        expect(spy, 'to have calls satisfying', [ [ 'add' ]]);
      });
  });

});
