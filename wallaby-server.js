
module.exports = function (wallaby) {
  
  return {
    files: ['server/**/*.js', '!server/**/tests/*.spec.js', 'config/**/*.json', {
      pattern: 'server/tests/fixtures/*',
      instrument: false
    }],
    tests: ['server/**/tests/*.spec.js'],
    debug: true,
    env: {
      type: 'node',
      runner: 'node'
    }
  }
};
