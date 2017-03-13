import React, { Component } from 'react';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import styles from './plugin-editor.css';

import { Row, Cell, FullRow } from '../Grid';
import AliasInput from './AliasInput';
import DependenciesInput from './DependenciesInput';
import EditInput from './EditInput';
import EditTextArea from './EditInput';
import InstallEditor from './InstallEditor/InstallEditor';

import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';

export default class PluginEditor extends Component {

  render() {
    const { onFieldChange } = this.props;
    const plugin = this.props.plugin;
    const definition = plugin.get('definition') || Immutable.Map();

    return (
      <div className={styles.pluginEditor}>
        <FullRow>
            <EditInput label="Name *"
                       field="name"
                       plugin={definition}
                       onChange={onFieldChange}
                       docs={
                         "The name of the plugin. This must be exactly what is reported by the `getName()` " +
                         "method of your plugin (case sensitive)"
                       }
            />
        </FullRow>
        <FullRow>
          <EditTextArea label="Description *"
                        field="description"
                        plugin={definition}
                        onChange={onFieldChange}
                        docs={
                          "Describe your plugin. This appears against this plugin in the list of plugins " +
                          "in plugin manager"
                        }
          />
        </FullRow>
        <FullRow>
          <EditInput label="Author *"
                     field="author"
                     plugin={definition}
                     onChange={onFieldChange}
                     docs={
                      "The author, authors and/or maintainers of the plugin. This can be the name, handle or email address," +
                      "or some combination of these"
                     }
          />
        </FullRow>
        <FullRow>
          <EditInput label="Website"
                     field="homepage"
                     plugin={definition}
                     onChange={onFieldChange}
                     docs={
                       "URL of the website or homepage of the plugin, if it has one"
                     }
          />
        </FullRow>
        <FullRow>
          <EditInput label="Source URL"
                     field="sourceURL"
                     plugin={definition}
                     onChange={onFieldChange}
                     docs={
                       "URL of the sourcecode. This can be a source control system (e.g. github), or a download of the " +
                       "compressed source"
                     }
          />
        </FullRow>
        <FullRow>
          <EditInput label="Latest Update"
                     field="latestUpdate"
                     plugin={definition}
                     onChange={onFieldChange}
                     docs={
                       "Changes in the latest release. This is shown in the notification window when the " +
                       "plugin has an update, and can help the user decide whether to install the update."
                     }
          />
        </FullRow>
        <FullRow>
          <EditInput label="Stability"
                     field="stability"
                     plugin={definition}
                     onChange={onFieldChange}
                     docs={
                       "Leave this blank, unless the plugin is unstable and could cause crashes. If there are reports of " +
                       "crashes from users, this field may be filled in for you.  When this field is populated, the plugin " +
                       "only shows up for users that have opted in to see unstable plugins."
                     }
          />
        </FullRow>
        <Row>
          <Cell small="12" large="6">
            <EditInput label="Minimum Notepad++ Version"
                       labelSize={4}
                       field="minNppVersion"
                       plugin={definition}
                       onChange={onFieldChange}
                       docs={
                        "The minimum required version of Notepad++ this plugin supports. If you're not sure, " +
                        "leave this blank. The API changes rarely, so it's likely to work with older versions, unless " +
                        "you are utilising new APIs or new features of Notepad++. If you do fill this in, be aware " +
                        "that the plugin will not show up for users on older versions."
                       }
            />
          </Cell>

          <Cell small="12" large="6">
            <EditInput label="Maximum Notepad++ Version"
                       field="maxNppVersion"
                       plugin={definition}
                       onChange={onFieldChange}
                       docs={
                         "The maximum supported version of Notepad++. If you're not sure, " +
                         "leave this blank. The API changes are almost invariably backwards compatible, so it is " +
                         "very rare that a plugin is not supported by a newer version.  If you do fill this in, be " +
                         "aware that the plugin will not show up for users on newer versions."
                       }
            />

          </Cell>
        </Row>
        <FullRow>
          <AliasInput label="Aliases"
                      aliases={definition.get('aliases') || Immutable.List()}
                      onFieldChange={onFieldChange}
                      docs={
                        "If the plugin has changes its name (that is, the return value from `getName()` has changed in " +
                        "different versions), enter other possible names here. This is only used to identify the plugin."
                      }
          />
        </FullRow>
        <FullRow>
          <DependenciesInput label="Dependencies"
                             dependencies={plugin}
                             docs={
                              "If your plugin depends on other plugins also being installed, list them here. When this plugin " +
                              "is installed, Plugin Manager will ensure that these plugins are also installed, and if not, recommend " +
                              "them to be installed at the same time."
                             }
          />
        </FullRow>
        <InstallEditor installSteps={definition.get('install') || Immutable.Map()}
                       installRemove="install"
                       pluginId={plugin.get('pluginId')}
        />
      </div>
    );
  }
}

