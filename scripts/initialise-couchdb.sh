#!/bin/bash

set -eu

COUCH_HOST=$1

COUCH_AUTH=admin:secret

echo Waiting for couchdb to start...
set +e
COUCH_RUNNING=$(curl -s http://${COUCH_HOST}/ | jq .couchdb)
while [ -n $COUCH_RUNNING ]; do
  COUCH_RUNNING=$(curl -s http://${COUCH_HOST}/)
  sleep 1;
done
set -e

echo Couchdb started.

USERS_EXISTS=$(curl -s http://${COUCH_HOST}/_users | jq -r .db_name)

if [ "$USERS_EXISTS" != "_users" ]; then
  echo Creating _users database...
  curl -sX PUT http://${COUCH_HOST}/_users
  echo Creating _replicator database...
  curl -sX PUT http://${COUCH_HOST}/_replicator
  echo Creating _global_changes database...
  curl -sX PUT http://${COUCH_HOST}/_global_changes;
fi

COUCH_NODE=$(curl -s http://${COUCH_HOST}/_membership | jq -r '.all_nodes[0]')

ADMIN_EXISTS=$(curl -s http://${COUCH_AUTH}@${COUCH_HOST}/_node/$COUCH_NODE/_config/admins | jq -r .admin)

if [ "$ADMIN_EXISTS" = "null" ]; then
  echo Creating admin user...
  curl -sX PUT http://${COUCH_HOST}/_node/${COUCH_NODE}/_config/admins/admin -d '"secret"';
fi

PLUGINS_EXISTS=$(curl -s http://$COUCH_HOST/plugins | jq -r .db_name)

if [ "$PLUGINS_EXISTS" != "plugins" ]; then
  echo Creating plugins database...
  curl -sX PUT http://${COUCH_AUTH}@${COUCH_HOST}/plugins;
fi

SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo Updating couchapp...
couchapp push $SCRIPTS_DIR/../couchapp/app.js http://${COUCH_AUTH}@${COUCH_HOST}/plugins

echo CouchDB initialised and running on port 5985 with credentials $COUCH_AUTH
