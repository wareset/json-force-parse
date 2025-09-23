# json-force-parse

Parse JSON-like data that contains unescaped text, comments, and extra or missing commas.

## Зачем?

Эта библиотека парсит JSONC, JSON5 и больше. Она обрабатывает неэкранированный текст, комментарии, а так же лишние или отсутствующие запятые. Это нужно для парсинга различных JSON подобных данных, а так же данных, которые были сгенерированы нейронными сетями и могут быть не совсем валидными.

Библиотека пока не выложена на `npm`, поэтому, для того чтобы ее поставить, нужно добавить в `package.json` что-то такое:

```json
{
  "dependencies": {
    "json-force-parse": "wareset/json-force-parse"
  }
}
```

Пример:

```js
import jsonParse from 'json-force-parse'

const data = `

{
  // inline comment
  /*
  block comment
  */

  strings: [ "double quotes", 'single quotes', without\\ quotes],
  unicode: \\u0048\\u0065\\u006C\\u006C\\u006F,
  hexcode: \\x77\\x6F\\x72\\x6C\\x64,

  'json5 text': 'Lorem ipsum \
dolor sit amet, \\
exercitation',

  // commas
  commas: [,,1,, true  null 5 你好世界 [,,]{ q: 1 w: 2 },,]

  // numeric
  numbers: [1, 0.0000, -0, NaN, -Infinity, -42e-10, -0x42]
}

/* incorrect block comment
`

// Необязательный второй параметр принимает функцию обработки.
// Она в точности соответствует работе в `JSON.parse` в Chrome
const reviver = function (key, value, source) {
  console.log(this, key, value, source)
  return value
}

const res = jsonParse(data, reviver)

// Результат:
res ===
  {
    strings: ['double quotes', 'single quotes', 'without quotes'],
    unicode: 'Hello',
    hexcode: 'world',

    'json5 text': 'Lorem ipsum dolor sit amet, exercitation',

    commas: [1, true, null, 5, '你好世界', [], { q: 1, w: 2 }],

    numbers: [1, 0, -0, NaN, -Infinity, -4.2e-9, -66],
  }
```

## Обработка ошибок

Данные могут быть действительно невалидными. В этом случае будет выброшено исключение в виде объекта с информацией.

Примеры:

```js
import jsonParse from 'json-force-parse'

// 1. Отсутствуют закрывающая скобка в конце файла
const json_1 = `[ 1 2 3 "text ]`
try {
  jsonParse(json_1)
} catch (e) {
  // Из-за пропущенной кавычки скобка попала в текст
  e ===
    {
      error: 'Missing bracket at the end',
      index: 15,
      slice: '[ 1 2 3 "text ]',
      value: [1, 2, 3, 'text ]'],
    }
}

// 2. Неправильно закрыта скобка
const json_2 = `[ [1,2], [3,4}, [5,6] ]`
try {
  jsonParse(json_2)
} catch (e) {
  e ===
    {
      error: 'Incorrect closing bracket',
      index: 13,
      slice: '[ [1,2], [3,4}',
      value: [
        [1, 2],
        [3, 4],
      ],
    }
}

// 3. Отсутствует значение для ключа
const json_3 = `{ q: 1, w:  , e: 3, r: 4 }`
try {
  jsonParse(json_3)
} catch (e) {
  e ===
    {
      error: 'Key "w" without value',
      index: 12,
      slice: '{ q: 1, w:  ,',
      value: { q: 1 },
    }
}

// 4. Отсутствует ключ для значения
const json_4 = `{ q: 1, w: 2,  : 3, r: 4 }`
try {
  jsonParse(json_4)
} catch (e) {
  e ===
    {
      error: 'Value "3" without key',
      index: 18,
      slice: '{ q: 1, w: 2,  : 3,',
      value: { q: 1, w: 2 },
    }
}

// 5. Присутствует ключ в массиве
const json_5 = `[1, 2, q: 3, 4 ]`
try {
  jsonParse(json_5)
} catch (e) {
  e ===
    {
      error: 'Key "q" in the array',
      index: 11,
      slice: '[1, 2, q: 3,',
      value: [1, 2],
    }
}
```

## License

[MIT](LICENSE)
