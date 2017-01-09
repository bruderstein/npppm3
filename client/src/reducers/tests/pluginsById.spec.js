
import pluginsById from '../pluginsById';
import Immutable from 'immutable';
import { INSTALL_STEP_ADD } from '../../actions';

import unexpected from 'unexpected';

const expect = unexpected.clone();

describe('pluginsById', function () {
  it('adds a step to a plugin', function () {

    const initialState = Immutable.fromJS({
      abc123: { name: 'test plugin', aliases: [] }
    });

    const result = pluginsById(initialState, {
      type: INSTALL_STEP_ADD,
      payload: {
        pluginId: 'abc123',
        installRemove: 'install',
        installType: 'unicode',
        type: 'download'
      }
    });

    expect(result.toJS(), 'to equal', {
      abc123: {
        name: 'test plugin',
        aliases: [],
        install: {
          unicode: [
            { type: 'download' }
          ]
        }
      }
    });

  });
});
