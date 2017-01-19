import 'isomorphic-fetch';

export function fetchJson(url, options) {
  return standardFetch(url, options)
    .then((response) => {
      return response.json();
    }).then(json => {
      return json;
    });
}

const standardFetch = function (url, options) {
  options = options || {};
  options.headers = options.headers || {};

  if (!options.type) {
    options.type = 'application/json';
  }

  if (typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
    options.headers['content-type'] = options.headers['content-type'] || 'application/json';
  }

  // Parse cookies
  const cookies = document.cookie.split(';').map(part => part.split('=')).reduce((all, [name, value]) => {
    all[name.trim()] = value && value.trim();
    return all;
  }, {});

  // Add authentication headers
  if (cookies.token && cookies.refresh) {
    options.headers['authorization'] = 'Bearer ' + cookies.token;
    options.headers['x-refresh-token'] = cookies.refresh;
  }

  return fetch(url, options);
};

export { standardFetch as fetch };
