
var ddoc = {
    _id: '_design/app',
    views: {}
};

module.exports = ddoc;

function findNewest (keys, values, rereduce) {
    var newest = null;
    var lastModified = 0;
    var index = values.length;
    var key = null;
    var current;
    for (index = values.length - 1; index >= 0; --index) {
        current = values[index]
            if (!newest || current.datestamp > lastModified) {
                newest = current;
                lastModified = current.datestamp;
                key = current.key || keys[index][1];
            }
    }

    newest.key = key;
    return newest;
}

ddoc.views.currentweb = {
    map: function (doc) {
        if (doc.type === 'current') {
            emit(doc._id, {
                name: doc.definition.name, 
                author: doc.definition.author, 
                unicodeVersion: doc.definition.unicodeVersion, 
                x64Version: doc.definition.x64Version,
                published: doc.published,
                lastModified: doc.datestamp,
                lastModifiedBy: doc.lastModifiedBy
            });
        }
    }
};

ddoc.views['current-hashes'] = {
    map: function (doc) {
      // Skip the disabled plugins, meaning we can easily turn off a plugin
      // and automatically not export their hashes
      if (doc.type === 'current' && doc.hashes && doc.disabled !== false) {
        // Emit all hashes
        doc.hashes.forEach(function (hash) {
          emit(hash.hash, hash.response)
        });
      }
    }
};

ddoc.views['published-hashes'] = {
  map: function (doc) {
    if (doc.type === 'published' && doc.hashes) {
      // Emit all hashes
      doc.hashes.forEach(function (hash) {
        emit(hash.hash, hash.response)
      });
    }
  }
};

ddoc.views.published = {
    map: function (doc) {
        if (doc.type === 'published') {
            emit(doc.pluginId, null);
        }
    }
};

ddoc.views.current = {
  map: function (doc) {
    if (doc.type === 'current') {
      emit(doc.pluginId, null);
    }
  }
};

ddoc.views.edit_history = {
    map: function (doc) {
        if (doc.type === 'edit-history') {
            emit([doc.pluginId, doc.datestamp], {pluginId: doc.pluginId, datestamp: doc.datestamp});
        }
    },
    reduce: findNewest
};


ddoc.views.publish_history = {
    map: function (doc) {
        if (doc.type === 'publish-history') {
            emit([doc.pluginId, doc.datestamp], {pluginId: doc.pluginId, datestamp: doc.datestamp});
        }
    },
    reduce: findNewest
};
