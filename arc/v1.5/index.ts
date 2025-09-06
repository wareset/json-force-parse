/*@__NO_SIDE_EFFECTS__*/
export function jsonParse2(
  s: string,
  reviver?: null | {
    // (
    //   this: any[] | { [key: string]: any },
    //   key: string,
    //   value: boolean | number | string | null,
    //   context: { source: string }
    // ): any
    // (
    //   this: any[] | { [key: string]: any },
    //   key: string,
    //   value: any[] | { [key: string]: any },
    //   context: {}
    // ): any
    (
      this: any[] | { [key: string]: any },
      key: string,
      value: boolean | number | string | null | any[] | { [key: string]: any },
      context: { source?: string }
    ): any
  }
) {
  if (s !== '' && s != null) {
    function err(): never {
      throw {
        error: 'Not valid JSON',
        index: i,
        slice: s.slice(0, index),
        value: cur.o,
      }
    }
    function save(v: any, _reviverList?: typeof reviverList) {
      tmp = key !== root ? key : cur.t === '[' ? '' + cur.o.length : err()
      cur.o[tmp] = v
      if (_reviverList) _reviverList.push([cur.o, tmp, v, { source }])
      key = root
      raw = []
    }
    function save_raw() {
      needSave = 0
      if (raw.length) {
        const v = raw.join('')
        save(
          raw[0] === ''
            ? v
            : (source = v) === 'false'
              ? false
              : v === 'true'
                ? true
                : v === 'null'
                  ? null
                  : iN((tmp = +v)) && v !== 'NaN'
                    ? v
                    : tmp,
          reviverList
        )
      }
    }

    s += ''

    const META_SYMBOLS: any = {
      b: '\b',
      t: '\t',
      n: '\n',
      f: '\f',
      r: '\r',
      v: '\v',
      0: '\0',
    }

    const root: any = {}
    let cur: { t: '[' | '{'; k?: any; o: any; p?: any } = { t: '{', o: root }
    let env: (typeof cur)[] = []

    const reviverList = reviver && ([] as [any, any, any, any][])

    let index = 0

    let tmp: any
    let key: any = ''
    let raw: any[] = []
    let source: string | undefined
    let needSave: number | undefined

    const iN = isNaN
    const toInt = parseInt
    const charCode = String.fromCharCode

    let i = 0
    let c: any
    const RX_SEP = /\s/
    for (; (c = s[i]); i++) {
      index = i
      if (RX_SEP.test(c)) {
        needSave = 1
      } else {
        switch (c) {
          case ':':
            if (key !== root) err()
            key = raw.join('')
            needSave = 0
            raw = []
            break
          case ',':
            save_raw()
            break
          case '[':
            save_raw()
            env.push(cur)
            cur = { t: c, p: cur.o, k: (save((c = [])), tmp), o: c }
            break
          case '{':
            save_raw()
            env.push(cur)
            cur = { t: c, p: cur.o, k: (save((c = {})), tmp), o: c }
            break
          case ']':
          case '}':
            save_raw()
            if ((cur.t === '{') !== (c === '}')) err()
            if (reviverList && cur.p)
              reviverList.push([cur.p, cur.k, cur.o, {}])
            cur = env.pop()!
            break
          case "'":
          case '"': {
            save_raw()
            // if (raw.length) err()
            raw = ['']
            for (; (tmp = s[++i]) && tmp !== c; )
              raw.push(
                tmp !== '\\'
                  ? tmp
                  : (tmp = s[++i]) in META_SYMBOLS
                    ? META_SYMBOLS[tmp]
                    : tmp === 'u'
                      ? charCode(toInt(s[++i] + s[++i] + s[++i] + s[++i], 16))
                      : tmp === 'x'
                        ? charCode(toInt(s[++i] + s[++i], 16))
                        : tmp || ''
              )
            if (reviverList) source = s.slice(index, i + 1)
            needSave = 1
            break
          }
          case '/':
            if ((tmp = s[i + 1]) === '*') {
              i += 2
              for (; (tmp = s[++i]) && (tmp !== c || s[i - 1] !== '*'); );
              break
            } else if (tmp === c) {
              ++i
              for (; (tmp = s[++i]) && tmp !== '\n' && tmp !== '\r'; );
              break
            }
          default:
            if (needSave) save_raw()
            raw.push(c)
        }
      }
    }
    save_raw()

    if (env.length) err()

    if (reviverList) {
      for (i = 0; (raw = reviverList[i]); ++i) {
        ;(tmp = raw[0]), (key = raw[1])
        tmp[key] = reviver.call(tmp, key, raw[2], raw[3])
      }
    }

    s = root['']
  }

  return s
}
