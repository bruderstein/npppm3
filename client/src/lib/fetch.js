import 'isomorphic-fetch';

export function fetchJson(url) {
  return fetch(url)
    .then((response) => {
      console.log('got response, fetching json', response);
      return response.json();
    }).then(json => {
      console.log('got json, returning', json);
      return json;
    });
}