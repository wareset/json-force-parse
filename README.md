# json-parse-with-comments

Parse JSON with comments

## Usage:
```js
import parse from 'json-parse-with-comments'

const source = `
  { 
    "foo": true, // Line comments
    /*
      Block comments
    */
    "bar": 42
  }
`;

const res = parse(source)
console.log(res)

// res:
{
  foo: true,
  bar: 42
}

```

## License
[MIT](LICENSE)
