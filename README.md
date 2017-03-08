# Notepad++ Plugin Manager Admin System

This is the web administration interface for [Notepad++](http://notepad-plus-plus.org) Plugin Manager

Plugin authors and maintainers will use this interface to edit their listings within the plugin manager.

The system that has served us well for several years is showing its age, and a number of things
have come to light that we weren't aware of when we first built the original system. So, time for a
redesign.

## What does it do?

### Plugin Metadata
Each plugin has a set of metadata (name, author, web site, dependencies etc), and a set of "steps"
required to install the plugin. There are currently 4 types of step available - "Download", "Copy", 
"Run" and "Delete".  

"Download" downloads the given URL to a sandbox area, and if it's a `.zip`
file, will extract all the files under that sandbox.

"Copy" copies a file from the sandbox to one of 3 areas - the plugins directory, the Notepad++
directory, or the plugin configuration directory.

"Run" runs a file, and is rarely used, but can be used install more complex plugins.

"Delete" removes a file from one of the 3 areas that copy can copy to.


A very usual plugin installation consists of a download step to download a ZIP file that contains
the DLL of the plugin, and a copy step to copy the DLL to the plugins directory. Some plugins have
additional copy steps to copy supporting DLLs etc into other directories.

A plugin author or maintainer can login to this administration system and edit their plugin's 
information (we trust our users, so currently every user can edit every plugin).

### After saving
Once the plugin details are saved, a new XML file can be generated, and installed in the host
where the Plugin Manager can download it from. This XML is called the development list. In the
present setup, this file is automatically available within a few minutes of saving the plugin.

In the previous implementation, every 2 weeks, the current set of plugin metadata is published 
as the "live" file. This is obviously problematic, as it means that edits made even minutes 
before the publish will be published as "live" to (literally) millions of users. 

### Plugin Storage
This new implementation stores the data in CouchDB, and each save saves a new instance of the 
plugin, complete with all steps etc (previously this was split up to rows in a MySQL database).
Each plugin is actually saved at least twice in Couch, once under the plugin ID, and once under a
unique ID, indexed by the plugin ID. This means all history can be easily retrieved (this won't be
part of the MVP, but is possible in the future). The "development" XML file can then be generated
at any point from the current versions of the plugin definitions.  When a plugin is ready to be
published, the plugin is saved again under a further key of the plugin ID with `-published` appended.
In a similar way to the edits, the plugin is also saved under a unique key as a `publishHistory` type.

This means a published plugin will have at least 4 "documents" in couchDB - the current edit, the
current published, and at least one edit history and one publish history.

This is done so we can always extract a list of published plugins and a list of the "current edits"
of plugins, and also always rollback to a previous version.

### File Validation

A copy step can optionally validate that a file is what is a known file. This is done generally
for any executable code, DLLs for example. The MD5 hash of the file being copied is validated
against a known list of "good" hashes on the server.  This is done at the point of copying the
file.

The list of valid hashes is also maintained by this administration system. The old system simply
kept a list of valid hashes, which meant it grew forever, and old hashes could never be removed,
as it could not be easily known if the hash was still in use.

This system will keep the valid hashes with the saved plugin (i.e. in the plugin document stored in
CouchDB).  When a file copy step is added in the UI, we can keep track of which files are validated,
and update the list of valid hashes for this plugin,_in this version_.

## Development environment

The project is setup to use Docker to create a local CouchDB instance. This works on Mac and Linux,
but has not been tried on Windows. If you would like to contribute and have problems with this step,
please raise an issue.

There are two projects - one server and one client. The server is a node.js server using [Hapi](http://hapijs.org),
and a client project using [React](http://reactjs.org) and [Redux](http://redux.js.org).

The project uses [yarn](http://yarnpkg.com) for package management. Find out from the website how
best to install it on your platform if you've not got it installed yet.

### Starting the development servers
In order to start the server, simply clone this project, do a `yarn install`, and then run `npm start`.

```bash
$ git clone git@github.com:bruderstein/npppm3
$ cd npppm3
$ yarn install
...
$ npm start
...
```
This creates the CouchDB server, installs the necessary design documents (or updates them if they're already there)
and creates an admin user for CouchDB (password is `secret`), and an admin user for the website (also 
`admin` and `secret`). It then starts the node.js server running on port 5003.

In a second terminal, `cd` to the `client` directory, do a `yarn install` there (they have separate 
package.json files) and then run `npm start`
```bash
$ cd npppm3/client
$ yarn install
...
$ npm start
```
This starts the webpack-dev-server, which listens on port 5001, and proxies requests for `/api` through to
the node server listening on port 5003.

Open your browser at http://localhost:5001/ and behold the beauty!

Login with `admin` and `secret`, and then you will be presented with an empty list of plugins.
(This is at the time of writing just a white page with a header).

If you navigate to http://localhost:5001/plugins/new you will be able to create a new plugin.
Only the name, author and description fields are mandatory.  Once you've saved the plugin, you can
go back to `/plugins` and see your new plugin in the list.
