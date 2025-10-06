const RX_FOR_PARSING = /\/\/[^\r\n\u2028\u2029]*|\/\*[^]*?(?:\*\/|$)|([^\s])/g
const RX_FOR_STRINGS =
  /\\(?:u([\da-f]{4})|x([\da-f]{2})|(?:\r\n?|\n|\u2028|\u2029)|(.))|([^\\'"]+)|('|")/gi
const RX_FOR_ANOTHER =
  /\\(?:u([\da-f]{4})|x([\da-f]{2})|(.))|((?:\/(?![/*])|[^\\{}[\],:'"/\s]+)+)|([{}[\],:'"/\s])/gi

const META_SYMBOLS: any = {
  __proto__: null as never,
  // https://tc39.es/ecma262/#table-string-single-character-escape-sequences
  b: '\b',
  t: '\t',
  n: '\n',
  v: '\v',
  f: '\f',
  r: '\r',
  // https://tc39.es/ecma262/#table-controlescape-code-point-values
  0: '\0',
}

const BRACKETS = { '{': '}', '[': ']' } as const

/*@__NO_SIDE_EFFECTS__*/
export default function jsonForceParse(
  text: string,
  reviver?: (
    this: any[] | { [key: string]: any },
    key: string,
    value: boolean | number | string | null | any[] | { [key: string]: any },
    context: { source?: string }
  ) => any
) {
  if (text !== void 0) {
    function error(message: string): never {
      throw {
        error: message,
        index,
        slice: text.slice(0, index + 1),
        value: root[''],
      }
    }
    function save(v: any, isObj?: 1 | 0, checkKey?: 1 | 0) {
      if (v !== root) {
        // To intentionally cause an error
        if (cur.o === root && key !== '' && key !== root) {
          cur.t = '['
        }

        cur.o[
          (tmp =
            cur.t === '['
              ? key === root
                ? cur.o.length
                : error('Key "' + key + '" in the array')
              : key !== root
                ? key
                : error(
                    'Value' + (isObj ? '' : ' "' + v + '"') + ' without key'
                  ))
        ] = v
        if (reviverList && !isObj) {
          reviverList.push([cur.o, tmp, v, { source }])
        }
        key = val = root
      } else if (checkKey && key !== root) {
        error('Key "' + key + '" without value')
      }
    }

    text += ''
    RX_FOR_PARSING.lastIndex = 0

    /**
     * Functions are declared as constants so that
     * they are not called globally in a `for`.
     */
    const fromCharCode = String.fromCharCode
    const toInt = parseInt

    const reviverList = reviver && ([] as [number, any, any, any][])

    // "root" is also used as a dummy for "key" and "val".
    // Instead of undefined.
    const root: any = {}
    const len = text.length
    let cur = { o: root } as { t: '[' | '{'; k: string; o: any; p: any }
    let env: (typeof cur)[] = []

    let tmp: any
    let key: any = ''
    let val: any = root
    let index = 0
    let source: string

    let match: RegExpExecArray | null
    let ch: any

    for (; (match = RX_FOR_PARSING.exec(text)); ) {
      if ((ch = match[1])) {
        index = match.index
        switch (ch) {
          case ',':
            save(val, 0, 1)
            break
          case ':':
            // For key check only
            save(root, 0, 1)
            key = val
            val = root
            break
          case '[':
          case '{':
            save(val)
            env.push(cur)
            /**
             * I use free variables so that I don't create extra
             * ones just to reduce the size. Because this is the
             * code in the library, not in the product.
             */
            cur = {
              t: ch,
              p: cur.o,
              k: (save((ch = ch === '[' ? [] : {}), 1), tmp),
              o: ch,
            }
            break
          case ']':
          case '}':
            save(val, 0, 1)
            if (BRACKETS[cur.t] !== ch) {
              error('Incorrect closing bracket')
            }
            if (reviverList && cur.p) {
              reviverList.push([cur.p, cur.k, cur.o, {}])
            }
            cur = env.pop()!
            break
          case "'":
          case '"':
            save(val)
            /**
             * Instead of adding strings, an array is used.
             * To avoid creating unnecessary strings in heap.
             */
            tmp = ['']
            RX_FOR_STRINGS.lastIndex = RX_FOR_PARSING.lastIndex
            for (; (match = RX_FOR_STRINGS.exec(text)); ) {
              if (match[5] === ch) {
                break
              } else {
                tmp.push(
                  match[1] || match[2]
                    ? fromCharCode(toInt(match[1] || match[2], 16))
                    : match[4] || META_SYMBOLS[match[3]] || match[3] || match[5]
                )
              }
            }

            if (!match) {
              error('Missing closing quote')
            }

            val = tmp.join('')
            if (reviverList) {
              source = text.slice(index, RX_FOR_STRINGS.lastIndex || len)
            }
            index = RX_FOR_PARSING.lastIndex = RX_FOR_STRINGS.lastIndex || len
            break
          default:
            save(val)
            tmp = ['']
            RX_FOR_ANOTHER.lastIndex = RX_FOR_PARSING.lastIndex - 1
            for (; (match = RX_FOR_ANOTHER.exec(text)); ) {
              if (match[5]) {
                --RX_FOR_ANOTHER.lastIndex
                break
              } else {
                tmp.push(
                  match[1] || match[2]
                    ? fromCharCode(toInt(match[1] || match[2], 16))
                    : match[4] || META_SYMBOLS[match[3]] || match[3]
                )
              }
            }
            ch = tmp.join('')
            if (reviverList) {
              source = text.slice(index, RX_FOR_ANOTHER.lastIndex || len)
            }
            index = RX_FOR_PARSING.lastIndex = RX_FOR_ANOTHER.lastIndex || len

            if (ch === 'null') {
              val = null
            } else if (ch === 'true') {
              val = true
            } else if (ch === 'false') {
              val = false
              // for -0x42
            } else if (ch[0] === '-') {
              val =
                ch[1] && ((tmp = -ch.slice(1)) === tmp || ch === '-NaN')
                  ? tmp
                  : ch
              // for +0x42
            } else if (ch[0] === '+') {
              val =
                ch[1] && ((tmp = +ch.slice(1)) === tmp || ch === '+NaN')
                  ? tmp
                  : ch
            } else {
              val = ch && ((tmp = +ch) === tmp || ch === 'NaN') ? tmp : ch
            }
        }
      }
    }
    save(val)

    if (env.length) error('Missing bracket at the end')

    if (reviverList) {
      for (val = 0; (tmp = reviverList[val]); ++val) {
        ;(env = tmp[0]), (key = '' + tmp[1])
        env[key] = reviver!.call(env, key, tmp[2], tmp[3])
      }
    }

    // To avoid writing unnecessary "return"
    // Because it affects the performance of the functions
    text = root['']
  }

  return text
}
