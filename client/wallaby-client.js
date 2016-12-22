
const babel = require('babel-core');

module.exports = function (wallaby) {

  return {
    files: ['src/**/*.js', 'src/**/*.jsx', '!src/**/tests/*.spec.js', 'package.json'],
    tests: ['src/**/tests/*.spec.js'],
    env: {
      type: 'node',
      runner: 'node'
    },
    compilers: {
      'src/**/*.js': wallaby.compilers.babel({
        babel: babel,
        "presets": ["es2015", "react"],
        "plugins": ["transform-object-rest-spread", "transform-class-properties"]
      }),
      'src/**/*.jsx': wallaby.compilers.babel({
        babel: babel,
        "presets": ["es2015", "react"],
        "plugins": ["transform-object-rest-spread", "transform-class-properties"]
      })
    },
    setup() {
      require.extensions['.jsx'] = require.extensions['.js'];
      wallaby.testFramework.configure(require('./package.json').jest)
    },
    testFramework: 'jest'
  }
};
