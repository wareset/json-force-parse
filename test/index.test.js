const assert = require('node:assert')

const jsonForceParse = require('../dist/index.js').default

function isEqual(string, result) {
  assert.deepStrictEqual(jsonForceParse(string), result)
}

function isError(string) {
  let err
  try {
    jsonForceParse(string)
  } catch (e) {
    err = e
  }
  if (!err) throw string
}

//
// json5 tests from:
// https://github.com/json5/json5/blob/main/test/parse.js
//

isEqual('{}', {})
isEqual('{"a":1}', { a: 1 })
isEqual("{'a':1}", { a: 1 })
isEqual('{a:1}', { a: 1 })
isEqual('{$_:1,_$:2,a\u200C:3}', { $_: 1, _$: 2, 'a\u200C': 3 })
isEqual('{ùńîċõďë:9}', { ùńîċõďë: 9 })

isEqual('{\\u0061\\u0062:1,\\u0024\\u005F:2,\\u005F\\u0024:3}', {
  ab: 1,
  $_: 2,
  _$: 3,
})

isEqual('{abc:1,def:2}', { abc: 1, def: 2 })
isEqual('{a:{b:2}}', { a: { b: 2 } })

isEqual('[]', [])
isEqual('[1]', [1])
isEqual('[1,2]', [1, 2])
isEqual('[1,[2,3]]', [1, [2, 3]])

isEqual('null', null)
isEqual('true', true)
isEqual('false', false)

isEqual('[0,0.,0e0]', [0, 0, 0])
isEqual('[1,23,456,7890]', [1, 23, 456, 7890])
isEqual('[-1,+2,-.1,-0]', [-1, +2, -0.1, -0])
isEqual('[.1,.23]', [0.1, 0.23])
isEqual('[1.0,1.23]', [1.0, 1.23])
isEqual('[1e0,1e1,1e01,1.e0,1.1e0,1e-1,1e+1]', [1, 1e1, 1e1, 1, 1.1, 1e-1, 1e1])
isEqual('[0x1,0x10,0xff,0xFF]', [1, 16, 255, 255])
isEqual('[Infinity,-Infinity]', [Infinity, -Infinity])
isEqual('NaN', NaN)
isEqual('-NaN', -NaN)
isEqual('1', 1)
isEqual('+1.23e100', +1.23e100)
isEqual('0x1', 0x1)
isEqual('-0x0123456789abcdefABCDEF', -0x0123456789abcdefabcdef)

isEqual('"abc"', 'abc')
isEqual("'abc'", 'abc')
isEqual(`['"',"'"]`, ['"', "'"])
isEqual(
  `'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\"'`,
  `\b\f\n\r\t\v\0\x0f\u01FF\a'"`
)
isEqual(`'\u2028\u2029'`, '\u2028\u2029')
isEqual(`{//comment\n}`, {})
isEqual(`{}//comment`, {})
isEqual(`{/*comment\n** */}`, {})
isEqual(`{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029\u2003}`, {})

isEqual('\\', '')

//
// tests for reviver
//
;(() => {
  const data = [
    {},
    { q: 1, s: 'a', e: [null] },
    [2, 'b', {}],
    3,
    'c',
    true,
  ].map(JSON.stringify)

  const jsonOriginResults = []
  function jsonOriginReviver(...a) {
    jsonOriginResults.push([this, ...a])
    return a[1]
  }

  const jsonForceParseResults = []
  function jsonForceParseReviver(...a) {
    jsonForceParseResults.push([this, ...a])
    return a[1]
  }

  for (let i = 0; i < data.length; i++) {
    JSON.parse(data[i], jsonOriginReviver)
    jsonForceParse(data[i], jsonForceParseReviver)
  }

  // console.log(jsonOriginResults)
  assert.deepStrictEqual(jsonOriginResults, jsonForceParseResults)
})()

//
// bad json
//
;(() => {
  const data = [
    // line comment
    /* block comment */
    {
      strings: ['', 'single quote"', '', "double quote'", 'without'],
      unicode: '\u0045\u0046',
      hexcode: '\x45\x46',
    },

    // not commas
    1,
    2,
    3,

    // numbers
    [1, 0, -0, NaN, -Infinity],
    // other
    ['+', '-', '/', ':', '*'],
  ]

  const json = `
[,,
    // line comment
    /* block comment */
     {
      strings: ['' 'single quote"', "",,"double quote'", without], , ,
      unicode: '\\u0045\\u0046'
      hexcode: '\\x45\\x46'
    }

    // not commas
    1
    2
    3

    // numbers
    [1, 0 -0, NaN -Infinity]
    ,
    // other
    [+, -, /, ':', *],
    ,,,
    ,,
]

  `

  assert.deepStrictEqual(data, jsonForceParse(json))
})()

// errors
isError('[1,2,3')
isError('[1,2,3]]')
isError('[1,2,3]}')
isError('{q:1')
isError('{q:1}}')
isError('{q:1}]')
isError('[1,2,q:3,4]')
isError('{ q:1, w: , e:3, r:4 }')
isError('{ q:1, w: 2, :3, r:4 }')
isError('{ q:1, w:  e :3, r:4 }')
isError('{ q:1, w:    :3, r:4 }')
