import { hashReducer, hashSelector } from '../hashes';
import Immutable from 'immutable';
import {  PLUGIN_FETCHED } from '../hashes';

import unexpected from 'unexpected';

const expect = unexpected.clone();

describe('hashReducer', function () {
  describe('PLUGIN_FETCHED', function () {

    it('adds the hashes', function () {

      const state = hashReducer(undefined, {
        type: PLUGIN_FETCHED,
        payload: {
          pluginId: 'abc123',
          hashes: {
            '11112222333344445555666677778888': 'ok',
            'aaaabbbbccccddddeeeeffff11112222': 'bad'
          }
        }
      });

      const result = hashSelector({ hashes: state }, 'abc123');
      expect(result.toJS(), 'to satisfy', {
        '11112222333344445555666677778888': 'ok',
        'aaaabbbbccccddddeeeeffff11112222': 'bad'
      });
    });
  });
});
