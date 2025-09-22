// I saved it just in case.
// const RX_FOR_JSON_LIKE_PARSE =
//   /[{}[\],:]|\/(?:\/[^\r\n]*|\*[^]*?(?:\*\/|$))|('|")(?:[^\\]|\\.?)*?(?:\1|$)|(?:\/(?![/*])|[^{}[\],:'"/\s]+)+/g

/*@__NO_SIDE_EFFECTS__*/
export default function jsonLikeParse(
  text: string,
  reviver?: (
    this: any[] | { [key: string]: any },
    key: string,
    value: boolean | number | string | null | any[] | { [key: string]: any },
    context: { source?: string }
  ) => any
) {
  /**
   * Everything is inside the function, not outside.
   * Since the 'JSON parse' is not the most frequent for call,
   * there is no point in constantly storing something extra in heap.
   */
  if (text !== '' && text != null) {
    function error(v: any): never | void {
      if (v !== root) {
        throw {
          error: 'Not valid JSON-LIKE',
          index,
          slice: text.slice(0, index),
          value: root[''],
        }
      }
    }
    function save(v: any, isObj?: 1) {
      if (v !== root) {
        // tmp = key !== root ? key : cur.t === '[' ? cur.o.length : error(0)
        cur.o[
          (tmp =
            cur.t === '['
              ? key === root
                ? cur.o.length
                : error(0)
              : key !== root
                ? key
                : error(0))
        ] = v
        reviverList && (isObj || reviverList.push([cur.o, tmp, v, { source }]))
        key = val = root
      }
    }

    // RX_FOR_JSON_LIKE_PARSE.lastIndex = 0
    /**
     * Instead of iterating, a regular expression is used
     * to avoid filling the heap with different garbage strings.
     */
    const RX_FOR_JSON_LIKE_PARSE =
      /[{}[\],:'"]|\/(?:\/[^\r\n\u2028\u2029]*|\*[^]*?(?:\*\/|$))|(?:\/(?![/*])|[^{}[\],:'"/\s]+)+/g
    const RX_FOR_NEW_LINE = /[\n\u2028\u2029]/

    const META_SYMBOLS: any = {
      // Getting rid of the prototype
      __proto__: null,
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      v: '\v',
      0: '\0',
    }

    /**
     * Functions are declared as constants so that
     * they are not called globally in a `for`.
     */
    const FROM_CHAR_CODE = String.fromCharCode
    const PARSE_INT = parseInt
    const IS_NAN = isNaN

    const reviverList = reviver && ([] as [any, any, any, any][])

    const root: any = {}
    let cur: { t: '[' | '{'; k?: any; o: any; p?: any } = { t: '{', o: root }
    let env: (typeof cur)[] = []

    let index = 0

    let tmp: any
    let key: any = ''
    let val: any = root
    let source: any

    let m: RegExpExecArray | null, c: any
    for (; (m = RX_FOR_JSON_LIKE_PARSE.exec(text)); ) {
      index = m.index
      switch ((c = m[0])) {
        case ':':
          error(key)
          key = val
          val = root
          break
        case ',':
          save(val)
          break
        case '[':
          // for partial strict mode
          // error(val)
          save(val)
          env.push(cur)
          cur = { t: c, p: cur.o, k: (save((c = []), 1), tmp), o: c }
          break
        case '{':
          // error(val)
          save(val)
          env.push(cur)
          cur = { t: c, p: cur.o, k: (save((c = {}), 1), tmp), o: c }
          break
        case ']':
        case '}':
          save(val)
          if ((cur.t === '{') !== (c === '}')) error(0)
          if (reviverList && cur.p) reviverList.push([cur.p, cur.k, cur.o, {}])
          cur = env.pop()!
          break
        case "'":
        case '"':
          save(val)
          /**
           * I use free variables so that I don't create extra
           * ones just to reduce the size. Because this is the
           * code for the library, not for the product.
           *
           * Instead of adding strings, an array is used.
           * To avoid creating unnecessary strings in heap.
           */
          tmp = ['']
          val = index
          for (; (source = text[++val]) && source !== c; )
            tmp.push(
              source !== '\\'
                ? source
                : (source = text[++val]) in META_SYMBOLS
                  ? META_SYMBOLS[source]
                  : source === 'u'
                    ? FROM_CHAR_CODE(
                        PARSE_INT(
                          text[++val] + text[++val] + text[++val] + text[++val],
                          16
                        )
                      )
                    : source === 'x'
                      ? FROM_CHAR_CODE(PARSE_INT(text[++val] + text[++val], 16))
                      : source === '\r'
                        ? (text[val + 1] === '\n' && ++val, '')
                        : RX_FOR_NEW_LINE.test(source)
                          ? ''
                          : source || ''
            )
          RX_FOR_JSON_LIKE_PARSE.lastIndex = ++val
          if (reviverList) source = text.slice(index, val)
          val = tmp.join('')
          break
        default:
          // if not comment
          if (c[0] !== '/' || (c[1] !== '/' && c[1] !== '*')) {
            // error(val)
            save(val)
            source = c
            val =
              c === 'false'
                ? false
                : c === 'true'
                  ? true
                  : c === 'null'
                    ? null
                    : c[0] === '-'
                      ? -c.slice(1)
                      : c[0] === '+'
                        ? +c.slice(1)
                        : IS_NAN((tmp = +c)) && c !== 'NaN'
                          ? c
                          : tmp
          }
      }
    }
    save(val)

    if (env.length) error(0)

    if (reviverList) {
      for (val = 0; (tmp = reviverList[val]); ++val) {
        ;(env = tmp[0]), (key = '' + tmp[1])
        env[key] = reviver!.call(env, key, tmp[2], tmp[3])
      }
    }

    text = root['']
  }

  return text
}
