export default function json_with_comments_parse(source: string): any {
  const env: [string, any][] = []
  let cur: [string, any] = ['[', env]

  let raw = ''
  let c: string, s: string, b: boolean

  let key: string
  const save_any = (obj: any): any => {
    cur[0] === '[' ? cur[1].push(obj) : cur[1][key] = obj
    return obj
  }
  const save_raw = (): void => {
    if (raw) {
      if (raw[0] === '"') save_any(JSON.parse(raw))
      else if (raw === 'true' || raw === 'false') save_any(raw === 'true')
      else if (raw === 'null') save_any(null)
      else save_any(+raw)
      raw = ''
    }
  }

  for (let l = source.length, i = 0; i < l; i++) {
    if (/^\S$/.test(c = source[i])) {
      switch (c) {
        case ',':
          save_raw()
          break
        case ':':
          key = raw[0] === '"' ? JSON.parse(raw) : raw, raw = ''
          break
        case '[':
          env.push(cur = [c, save_any([])])
          break
        case '{':
          env.push(cur = [c, save_any({})])
          break
        case ']':
        case '}':
          save_raw(), env.pop(), cur = env[env.length - 1]
          break
        case '"':
          raw = c
          for (b = !1; ++i < l && (raw += source[i],
          b || source[i] !== c); b = b ? !1 : source[i] === '\\');
          break
        case '/':
          if ((s = source[i + 1]) === '*') {
            s = raw, raw = c
            for (;++i < l && (raw += source[i],
            !(raw.length > 3 && source[i] === '/' && source[i - 1] === '*')););
            raw = s
          } else if (s === '/') {
            s = raw, raw = c
            for (;++i < l && (raw += source[i],
            /[^\r\n\u2028\u2029]/.test(source[i])););
            raw = s
          } else {
            raw += c
          }
          break
        default:
          raw += c
      }
    }
  }
  save_raw()
  return env[0]
}
