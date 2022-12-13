const REG_IS_NOT_EMPTY = /^\S$/
const REG_IS_NOT_NEW_LINE = /^[^\r\n\u2028\u2029]$/

const META: any = { b: '\b', t: '\t', n: '\n', f: '\f', r: '\r' }

// const get_escaped_char = (s: string, i: number, i2: number): string => {
//   let res = s[i] || ''
//   if (i === i2) res in META && (res = META[s[i]])
//   else res = String.fromCharCode(parseInt(s[++i] + s[++i] + s[++i] + s[++i], 16))
//   return res
// }

export default function json_with_comments_parse(source: string): any {
  const env: [string, any][] = []
  let cur: [string, any] = ['[', env]

  let raw: string[] = []
  let c: string, s: string, b: boolean, n: number

  let key: string
  const save_val = (obj: any): any => {
    cur[0] === '[' ? cur[1].push(obj) : cur[1][key] = obj
    return obj
  }
  const save_raw = (): void => {
    if (raw.length) {
      s = raw.join('')
      if (raw[0] === '') save_val(s)
      else if ((b = s === 'true') || s === 'false') save_val(b)
      else if (s === 'null') save_val(null)
      else save_val(+s)
      raw = []
    }
  }

  for (let l = source.length, i = 0; i < l; i++) {
    if (REG_IS_NOT_EMPTY.test(c = source[i])) {
      switch (c) {
        case ',':
          save_raw()
          break
        case '[':
          env.push(cur = [c, save_val([])])
          break
        case '{':
          env.push(cur = [c, save_val({})])
          break
        case ']':
        case '}':
          save_raw()
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
                    ? String.fromCharCode(parseInt(
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
  save_raw()
  return env[0]
}
