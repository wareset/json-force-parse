const { resolve } = require('path')
const { readFileSync } = require('fs')

const json_parse = require('../index.js').default

const FILE_TSCONFIG_JSON = resolve(__dirname, '../tsconfig.json')

console.log(json_parse(readFileSync(FILE_TSCONFIG_JSON, 'utf8')))
