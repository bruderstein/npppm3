
import { pluginsByIdReducer as pluginsById } from '../pluginsById';
import Immutable from 'immutable';
import { PLUGIN_CREATED, PLUGIN_FIELD_CHANGED, INSTALL_STEP_ADD, PLUGIN_FETCHED, FILE_LIST_FETCHED } from '../pluginsById';

import unexpected from 'unexpected';

const expect = unexpected.clone();

describe('pluginsById', function () {

  describe('INSTALL_STEP_ADD', function () {
    it('adds a step to a plugin', function () {
      const initialState = Immutable.fromJS({
        abc123: { definition: { name: 'test plugin', aliases: [] } }
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
          definition: {
            name: 'test plugin',
            aliases: [],
            install: {
              unicode: [
                { type: 'download' }
              ]
            }
          }
        }
      });

    });
  });

  describe('PLUGIN_FIELD_CHANGED', function () {

    it('changes the given field in the plugin', function () {

      const initialState = Immutable.fromJS({
        abc123: { definition: { name: 'test plugin', aliases: [] } }
      });
      let state = pluginsById(initialState, {
        type: PLUGIN_FIELD_CHANGED,
        payload: {
          pluginId: 'abc123',
          field: 'name',
          value: 'different test plugin'
        }
      });

      expect(state.toJS(), 'to equal', {
        abc123: {
          definition: {
            name: 'different test plugin',
            aliases: []
          }
        }
      });
    });
  });

  describe('PLUGIN_CREATED', function () {
    it('creates a plugin with ID `new`', function () {
      const initialState = Immutable.fromJS({
        abc123: { definition: { name: 'test plugin', aliases: [] } }
      });
      let state = pluginsById(initialState, {
        type: PLUGIN_CREATED
      });
      expect(state.toJS(), 'to satisfy', {
        abc123: {},
        'new': {}
      })
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
          _rev: '1-111222',
          definition: {
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
                  from: '*.dll',
                  to: '$PLUGINDIR$'
                }
              ]
            }
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
          definition: {
            install: {
              unicode: [
                {
                  type: 'download',
                  $filesAvailable: [
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                  ]
                },
                { type: 'copy' }
              ]
            }
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
          definition: {
            install: {
              unicode: [
                {
                  type: 'download',
                },
                {
                  type: 'copy',
                  $inheritedFiles: [
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                  ]
                }
              ]
            }
          }
        }
      });

    });

    it('marks the inherited files as matching', function () {

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

      expect(state.getIn(['abc123', 'definition']).toJS(), 'to satisfy', {
        install: {
          unicode: [
            { type: 'download' },
            { type: 'copy', from: '*.dll', $inheritedFiles: [
              { name: 'plugin.dll', highlighted: true },
              { name: 'readme.txt', highlighted: expect.it('to be falsy') }
            ]
            }
          ]
        }
      })
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
          _rev: '2-222333',
          definition: {
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
          definition: {
            install: {
              unicode: [
                { type: 'download', $filesAvailable: undefined },
                { type: 'copy', $inheritedFiles: [] },
                {
                  type: 'download',
                  $filesAvailable: [
                    { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' }
                  ]
                },
                {
                  type: 'copy',
                  $inheritedFiles: [
                    { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' }
                  ]
                }
              ]
            }
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
          definition: {
            install: {
              unicode: [
                {
                  type: 'download',
                  $filesAvailable: [
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '11112222333344445555666677778888' },
                  ]
                },
                {
                  type: 'copy',
                  $inheritedFiles: [
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '11112222333344445555666677778888' },
                  ]
                },
                {
                  type: 'download',
                  $filesAvailable: [
                    { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '88887777666655554444333322221111' },
                  ]
                },
                {
                  type: 'copy',
                  $inheritedFiles: [
                    { name: 'addon.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '88887777666655554444333322221111' } // readme.txt from plugin-addons.zip
                  ]
                }
              ]
            }
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
          definition: {
            install: {
              unicode: [
                {
                  type: 'download',
                  $filesAvailable: [
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                  ]
                },
                {
                  type: 'copy',
                  $inheritedFiles: [
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                  ]
                },
                {
                  type: 'download'
                },
                {
                  type: 'copy',
                  $inheritedFiles: [
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                  ]
                },
                {
                  type: 'copy',
                  $inheritedFiles: [
                    { name: 'plugin.dll', md5: 'aaaabbbbccccddddeeeeffff11112222' },
                    { name: 'readme.txt', md5: '11112222333344445555666677778888' }
                  ]
                }
              ]
            }
          }
        }
      });

    });


  describe('PLUGIN_FIELD_CHANGED `from` in copy step', function () {

    it('marks the inherited files as matching', function () {

      let state = pluginsById(undefined, {
        type: PLUGIN_FETCHED,
        response: {
          pluginId: 'abc123',
          definition: {
            name: 'foo plugin',
            author: 'Mr Bar',
            install: {
              unicode: [
                { type: 'download', url: 'http://example.com/plugin.zip' },
                { type: 'copy' }
              ]
            }
          }
        }
      });

      state = pluginsById(state, {
        type: 'FILE_LIST_FETCHED',
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          url: 'http://example.com/plugin.zip',
          files: [
            { name: 'plugin.dll', md5: 'aaabbbcc' },
            { name: 'plugin2.dll', md5: '111222333' },
            { name: 'readme.txt', md5: '444555666' }
          ]
        }
      });
      // TODO: Set the 'to' field of  the copy step, and then validate the plugin.dll file is highlighted
      state = pluginsById(state, {
        type: 'INSTALL_STEP_FIELD_CHANGED',
        payload: {
          pluginId: 'abc123',
          installRemove: 'install',
          installType: 'unicode',
          stepNumber: 1,
          field: 'from',
          value: '*.dll'
        }
      });

      expect(state.getIn(['abc123', 'definition']).toJS(), 'to satisfy', {
        install: {
          unicode: [
            { type: 'download' },
            { type: 'copy', from: '*.dll', $inheritedFiles: [
              { name: 'plugin.dll', highlighted: true },
              { name: 'plugin2.dll', highlighted: true },
              { name: 'readme.txt', highlighted: expect.it('to be falsy') }
            ] }
          ]
        }
      })
    });
  });
});
