
import pluginsById from '../pluginsById';
import Immutable from 'immutable';
import { INSTALL_STEP_ADD, PLUGIN_FETCHED, FILE_LIST_FETCHED } from '../../actions';

import unexpected from 'unexpected';

const expect = unexpected.clone();

describe('pluginsById', function () {

  describe('INSTALL_STEP_ADD', function () {
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

  describe('PLUGIN_FETCHED', function () {

    it('adds the plugin to the collection', function () {

      const baseState = pluginsById(undefined, {});
      const withPluginState = pluginsById(baseState, {
        type: PLUGIN_FETCHED,
        response: {
          pluginId: 'abc123',
          name: 'foo plugin',
          author: 'Mr Bar'
        }
      });

      expect(withPluginState.get('abc123').toJS(), 'to equal', {
        pluginId: 'abc123',
        name: 'foo plugin',
        author: 'Mr Bar'
      });

    });
  });
  
  describe('FILE_LIST_FETCHED', function () {
    let state;
    beforeEach(function () {
      const baseState = pluginsById(undefined, {});
      state = pluginsById(baseState, {
        type: PLUGIN_FETCHED,
        response: {   // TODO: Need to change this to `payload`
          pluginId: 'abc123',
          name: 'foo plugin',
          author: 'Mr Bar',
          install: {
            unicode: [
              {
                type: 'download',
                url: 'http://example.com/plugin.zip'
              },
              {
                type: 'copy',
                from: 'plugin.dll',
                to: '$PLUGINDIR$'
              }
            ]
          }
        }
      });

    });

    it('adds the filelist to the plugin step', function () {
      state = pluginsById(state, {
        type: FILE_LIST_FETCHED,
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          url: 'http://example.com/plugin.zip',
          files: [
            { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
            { name: 'readme.txt', md5: '11112222333344445555666677778888' }
          ]
        }
      });

      expect(state.toJS(), 'to satisfy', {
        abc123: {
          install: {
            unicode: [
              {
                type: 'download',
                filesAvailable: [
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                ]
              },
              { type: 'copy' }
            ]
          }
        }
      });

    });

    it('adds the inherited files to the copy step', function () {
      state = pluginsById(state, {
        type: FILE_LIST_FETCHED,
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          url: 'http://example.com/plugin.zip',
          files: [
            { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
            { name: 'readme.txt', md5: '11112222333344445555666677778888' }
          ]
        }
      });

      expect(state.toJS(), 'to satisfy', {
        abc123: {
          install: {
            unicode: [
              {
                type: 'download',
              },
              {
                type: 'copy',
                inheritedFiles: [
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                ]
              }
            ]
          }
        }
      });

    });
  });

  describe('FILE_LIST_FETCHED with multiple downloads', function () {

    let state;
    beforeEach(function () {
      const baseState = pluginsById(undefined, {});
      state = pluginsById(baseState, {
        type: PLUGIN_FETCHED,
        response: {   // TODO: Need to change this to `payload`
          pluginId: 'abc123',
          name: 'foo plugin',
          author: 'Mr Bar',
          install: {
            unicode: [
              {
                type: 'download',
                url: 'http://example.com/plugin.zip'
              },
              {
                type: 'copy',
                from: 'plugin.dll',
                to: '$PLUGINDIR$'
              },
              {
                type: 'download',
                url: 'http://example.com/plugin-addons.zip'
              },
              {
                type: 'copy',
                from: 'addon.dll',
                to: '$NPPDIR$'
              }
            ]
          }
        }
      });

    });

    it('only applies to the inherited files to copy steps AFTER the download', function () {

      state = pluginsById(state, {
        type: FILE_LIST_FETCHED,
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          url: 'http://example.com/plugin-addons.zip',
          files: [
            { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' }
          ]
        }
      });

      expect(state.toJS(), 'to satisfy', {
        abc123: {
          install: {
            unicode: [
              { type: 'download', filesAvailable: undefined },
              { type: 'copy', inheritedFiles: [] },
              {
                type: 'download',
                filesAvailable: [
                  { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' }
                ]
              },
              {
                type: 'copy',
                inheritedFiles: [
                  { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' }
                ]
              }
            ]
          }
        }
      });

    });

    it('merges files when there is more than one download', function () {

      state = pluginsById(state, {
        type: FILE_LIST_FETCHED,
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          url: 'http://example.com/plugin.zip',
          files: [
            { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
            { name: 'readme.txt', md5: '11112222333344445555666677778888' },
          ]
        }
      });

      // Second file set arrives
      // with an new file (addon.dll), and a file of the same name but different content
      // Copy steps AFTER the download of that should use the newer (second) version of the file
      state = pluginsById(state, {
        type: FILE_LIST_FETCHED,
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          url: 'http://example.com/plugin-addons.zip',
          files: [
            { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
            { name: 'readme.txt', md5: '88887777666655554444333322221111' },
          ]
        }
      });
      expect(state.toJS(), 'to satisfy', {
        abc123: {
          install: {
            unicode: [
              {
                type: 'download',
                filesAvailable: [
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '11112222333344445555666677778888' },
                ]
              },
              {
                type: 'copy',
                inheritedFiles: [
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '11112222333344445555666677778888' },
                ]
              },
              {
                type: 'download',
                filesAvailable: [
                  { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '88887777666655554444333322221111' },
                ]
              },
              {
                type: 'copy',
                inheritedFiles: [
                  { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '88887777666655554444333322221111' } // readme.txt from plugin-addons.zip
                ]
              }
            ]
          }
        }
      });

    });


    it('adds inheritedFiles when a copy step is added', function () {

      state = pluginsById(state, {
        type: FILE_LIST_FETCHED,
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          url: 'http://example.com/plugin.zip',
          files: [
            { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
            { name: 'readme.txt', md5: '11112222333344445555666677778888' },
          ]
        }
      });

      state = pluginsById(state, {
        type: INSTALL_STEP_ADD,
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          type: 'copy'
        }
      });

      expect(state.toJS(), 'to satisfy', {
        abc123: {
          install: {
            unicode: [
              {
                type: 'download',
                filesAvailable: [
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                ]
              },
              {
                type: 'copy',
                inheritedFiles: [
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                ]
              },
              {
                type: 'download'
              },
              {
                type: 'copy',
                inheritedFiles: [
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                ]
              },
              {
                type: 'copy',
                inheritedFiles: [
                  { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                  { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                ]
              }
            ]
          }
        }
      });

    });
  });
});
