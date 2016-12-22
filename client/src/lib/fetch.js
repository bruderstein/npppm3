import 'isomorphic-fetch';

export function fetchJson(url) {
  return fetch(url)
    .then((response) => {
      return response.json();
    }).then(json => {
      return json;
    });
}

export function fetch(url, options) {
  if (!options.type) {
    options.type = 'application/json';
  }
  if (typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
    options.headers = options.headers || {};
    options.headers['content-type'] = options.headers['content-type'] || 'application/json';
  }

  return fetch(url, options);
}
