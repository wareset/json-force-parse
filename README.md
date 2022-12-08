# json-with-comments-parse

Parse JSON with comments

## Usage:
```js
import parse from 'json-with-comments-parse'

const source = `
  { 
    "foo": true, // Line comments
    /*
      Block comments
    */
    "bar": 42
  }
`;

parse(source)

```

## License
[MIT](LICENSE)
