module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    app: 'readonly',
    resolve: 'readonly',
    log: 'readonly',
    Java: 'readonly',
    __: 'readonly',
    $: 'readonly',
    define: 'readonly',
    compareObjects: 'readonly',
    __FILE__: 'readonly',
    __LINE__: 'readonly',
    __DIR__: 'readonly',
    fetch: false,
    FormData: false
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    // https://eslint.org/docs/user-guide/getting-started and https://eslint.org/docs/user-guide/configuring
    'import/no-absolute-path': [
        'off',
        {
            'esmodule': true,
            'commonjs': true,
            'amd': false
        }
    ],
  }
}
