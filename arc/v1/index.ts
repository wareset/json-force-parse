const REG_IS_NOT_EMPTY = /^\S$/
const REG_IS_NOT_NEW_LINE = /^[^\r\n\u2028\u2029]$/

const META: any = { b: '\b', t: '\t', n: '\n', f: '\f', r: '\r' }

// const get_escaped_char = (s: string, i: number, i2: number): string => {
//   let res = s[i] || ''
//   if (i === i2) res in META && (res = META[s[i]])
//   else res = String.fromCharCode(parseInt(s[++i] + s[++i] + s[++i] + s[++i], 16))
//   return res
// }

function save_val(cur: [string, any], key: string, val: any): any {
  cur[0] === '[' ? cur[1].push(val) : cur[1][key] = val
  return val
}

function save_raw(cur: [string, any], s: string, raw: string[]): void {
  if (raw.length) {
    save_val(
      cur, s, (s = raw.join(''),
      raw[0] === '' ? s
        : s === 'false' ? false
          : s === 'true' ? true
            : s === 'null' ? null
              : +s)
    )
  }
}

export default function json_with_comments_parse(source: string): any {
  const __parseInt__ = parseInt
  const __fromCharCode__ = String.fromCharCode
  
  const env: [string, any][] = []
  let cur: [string, any] = ['[', env]

  let raw: string[] = []
  let c: string, s: string, n: number

  let key: string

  for (let l = source.length, i = 0; i < l; i++) {
    if (REG_IS_NOT_EMPTY.test(c = source[i])) {
      switch (c) {
        case ',':
          save_raw(cur, key!, raw), raw = []
          break
        case '[':
          env.push(cur = [c, save_val(cur, key!, [])])
          break
        case '{':
          env.push(cur = [c, save_val(cur, key!, {})])
          break
        case ']':
        case '}':
          save_raw(cur, key!, raw), raw = []
          env.pop(), cur = env[env.length - 1]
          break
        case ':':
          key = raw.join(''), raw = []
          break
        case '"':
          raw = ['']
          // for (b = false; ++i < l && (raw.push(source[i]),
          // b || source[i] !== c); b = b ? false : source[i] === '\\');
          // for (;++i < l && source[i] !== '"';) {
          //   raw.push(source[i] !== '\\' ? source[i]
          //     : get_escaped_char(source, ++i, source[i] !== 'u' ? i : i += 4))
          // }
          for (;++i < l && source[i] !== c;) {
            raw.push(
              source[i] !== '\\'
                ? source[i]
                : source[++i] in META
                  ? META[source[i]]
                  : source[i] === 'u'
                    ? __fromCharCode__(__parseInt__(
                      source[++i] + source[++i] + source[++i] + source[++i], 16
                    ))
                    : source[i] || ''
            )
          }
          break
        case '/':
          if ((s = source[i + 1]) === '*') {
            i++
            for (n = 0; ++i < l &&
            !(n++ && source[i] === c && source[i - 1] === s););
          } else if (s === c) {
            i++
            for (;++i < l && REG_IS_NOT_NEW_LINE.test(source[i]););
          } else {
            raw.push(c)
          }
          break
        default:
          raw.push(c)
      }
    }
  }
  save_raw(cur, key!, raw)
  return env[0]
}
