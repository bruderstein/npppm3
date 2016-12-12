'use strict';

const server = require('./server');

server.then(instance => {
  console.log('Starting...');
  instance.start(err => {
    if (err) {
      console.log('Error starting server:', err);
      return;
    }
    console.log('Server started');
  });
}).catch(err => {
  console.log('Error constructing server from manifest', err, err.stack);
});