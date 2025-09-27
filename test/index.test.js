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
const json5_fixtures = [
  {
    string: `{}`,
    result: {},
  },
  {
    string: `{"a":1}`,
    result: { a: 1 },
  },
  {
    string: `{'a':1}`,
    result: { a: 1 },
  },
  {
    string: `{a:1}`,
    result: { a: 1 },
  },
  {
    string: `{$_:1,_$:2,a\u200C:3}`,
    result: { $_: 1, _$: 2, 'a\u200C': 3 },
  },
  {
    string: `{ùńîċõďë:9}`,
    result: { ùńîċõďë: 9 },
  },

  {
    string: `{\\u0061\\u0062:1,\\u0024\\u005F:2,\\u005F\\u0024:3}`,
    result: { ab: 1, $_: 2, _$: 3 },
  },
  {
    string: `{abc:1,def:2}`,
    result: { abc: 1, def: 2 },
  },
  {
    string: `{a:{b:2}}`,
    result: { a: { b: 2 } },
  },

  {
    string: `[]`,
    result: [],
  },
  {
    string: `[1]`,
    result: [1],
  },
  {
    string: `[1,2]`,
    result: [1, 2],
  },
  {
    string: `[1,[2,3]]`,
    result: [1, [2, 3]],
  },

  {
    string: `null`,
    result: null,
  },
  {
    string: `true`,
    result: true,
  },
  {
    string: `false`,
    result: false,
  },

  {
    string: `[0,0.,0e0]`,
    result: [0, 0, 0],
  },
  {
    string: `[1,23,456,7890]`,
    result: [1, 23, 456, 7890],
  },
  {
    string: `[-1,+2,-.1,-0]`,
    result: [-1, +2, -0.1, -0],
  },
  {
    string: `[.1,.23]`,
    result: [0.1, 0.23],
  },
  {
    string: `[1.0,1.23]`,
    result: [1.0, 1.23],
  },
  {
    string: `[1e0,1e1,1e01,1.e0,1.1e0,1e-1,1e+1]`,
    result: [1, 1e1, 1e1, 1, 1.1, 1e-1, 1e1],
  },
  {
    string: `[0x1,0x10,0xff,0xFF]`,
    result: [1, 16, 255, 255],
  },
  {
    string: `[Infinity,-Infinity]`,
    result: [Infinity, -Infinity],
  },
  {
    string: `NaN`,
    result: NaN,
  },
  {
    string: `-NaN`,
    result: -NaN,
  },
  {
    string: `1`,
    result: 1,
  },
  {
    string: `+1.23e100`,
    result: +1.23e100,
  },
  {
    string: `0x1`,
    result: 0x1,
  },
  {
    string: `-0x0123456789abcdefABCDEF`,
    result: -0x0123456789abcdefabcdef,
  },

  {
    string: `"abc"`,
    result: 'abc',
  },
  {
    string: `'abc'`,
    result: 'abc',
  },
  {
    string: `['"',"'"]`,
    result: ['"', "'"],
  },
  {
    string: `'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\"'`,
    result: `\b\f\n\r\t\v\0\x0f\u01FF\a'"`,
  },
  {
    string: `'\u2028\u2029'`,
    result: '\u2028\u2029',
  },
  {
    string: `{//comment\n}`,
    result: {},
  },
  {
    string: `{}//comment`,
    result: {},
  },
  {
    string: `{/*comment\n** */}`,
    result: {},
  },
  {
    string: `{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029\u2003}`,
    result: {},
  },

  {
    string: `\\`,
    result: '',
  },
  {
    string: ``,
    result: void 0,
  },
  {
    string: ` `,
    result: void 0,
  },
  {
    string: ` /*  */ `,
    result: void 0,
  },
  {
    string: ` // \n `,
    result: void 0,
  },
]

for (const data of json5_fixtures) {
  isEqual(data.string, data.result)
}

//
// errors
//
const errors_fixtures = [
  '[1,2,3',
  '[1,2,3]]',
  '[1,2,3]}',
  '{q:1',
  '{q:1}}',
  '{q:1}]',
  '[1,2,q:3,4]',
  '{ q:1, w: , e:3, r:4 }',
  '{ q:1, w: 2, :3, r:4 }',
  '{ q:1, w:  e :3, r:4 }',
  '{ q:1, w:    :3, r:4 }',
  '12 23',
  '12 23:45',
  '[ "text ]',
]

for (const string of errors_fixtures) {
  isError(string)
}

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
