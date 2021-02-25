module.exports = {
  extends: './node_modules/@cody-greene/eslint-config/strict.yml',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true
    }
  },
  env: {
    node: true,
    es6: true
  }
}
