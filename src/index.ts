// I saved it just in case.
// const RX_FOR_BASE_PARSING =
//   /[{}[\],:]|\/(?:\/[^\r\n\u2028\u2029]*|\*[^]*?(?:\*\/|$))|('|")(?:[^\\]|\\.?)*?(?:\1|$)|(?:\/(?![/*])|[^{}[\],:'"/\s]+)+/g

const RX_FOR_PARSING = /\/(?:\/[^\r\n\u2028\u2029]*|\*[^]*?(?:\*\/|$))|[^\s]/g
const RX_FOR_STRINGS =
  /\\(?:u([\da-f]{4})|x([\da-f]{2})|(?:\r\n?|\n|\u2028|\u2029)|(.))|([^\\'"]+)|('|")/gi
const RX_FOR_ANOTHER =
  /\\(?:u([\da-f]{4})|x([\da-f]{2})|(.))|((?:\/(?![/*])|[^\\{}[\],:'"/\s]+)+)|([{}[\],:'"/\s])/gi

const META_SYMBOLS: any = {
  // Getting rid of the prototype
  __proto__: null,
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
  if (text) {
    function error(message: string): never | void {
      throw {
        error: 'JSON-LIKE-PARSE: ' + message,
        index,
        slice: text.slice(0, index + 1),
        value: root[''],
      }
    }
    function save(v: any, isObj?: 1) {
      if (v !== root) {
        cur.o[
          (tmp =
            cur.t === '['
              ? key === root
                ? cur.o.length
                : error('There is a key "' + key + '" in the array')
              : key !== root
                ? key
                : error('There is no key for the value "' + v + '"'))
        ] = v
        reviverList && (isObj || reviverList.push([cur.o, tmp, v, { source }]))
        key = val = root
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

    const reviverList = reviver && ([] as [any, any, any, any][])

    const root: any = {}
    const len = text.length
    let cur: { t: '[' | '{'; k?: any; o: any; p?: any } = { t: '{', o: root }
    let env: (typeof cur)[] = []

    let tmp: any
    let key: any = ''
    let val: any = root
    let index = 0
    let source: any

    let match: RegExpExecArray | null
    let ch: any

    for (; (match = RX_FOR_PARSING.exec(text)); ) {
      index = match.index
      switch ((ch = match[0])) {
        case ',':
          save(val)
          key = root
          break
        case ':':
          if (key !== root) {
            error('The "' + key + '" key is replaced by "' + val + '"')
          }
          key = val
          val = root
          break
        case '[':
          save(val)
          env.push(cur)
          cur = { t: ch, p: cur.o, k: (save((ch = []), 1), tmp), o: ch }
          break
        case '{':
          save(val)
          env.push(cur)
          cur = { t: ch, p: cur.o, k: (save((ch = {}), 1), tmp), o: ch }
          break
        case ']':
        case '}':
          save(val)
          if ((cur.t === '{') !== (ch === '}')) {
            error('Incorrect closing brackets')
          }
          if (reviverList && cur.p) reviverList.push([cur.p, cur.k, cur.o, {}])
          cur = env.pop()!
          break
        case "'":
        case '"':
          // error(val)
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
          RX_FOR_STRINGS.lastIndex = RX_FOR_PARSING.lastIndex
          for (; (val = RX_FOR_STRINGS.exec(text)); ) {
            if (val[5] === ch) {
              break
            } else {
              tmp.push(
                val[1] || val[2]
                  ? fromCharCode(toInt(val[1] || val[2], 16))
                  : val[4] || META_SYMBOLS[val[3]] || val[3] || val[5] || ''
              )
            }
          }
          val = tmp.join('')
          if (reviverList) {
            source = text.slice(index, RX_FOR_STRINGS.lastIndex || len)
          }
          index = RX_FOR_PARSING.lastIndex = RX_FOR_STRINGS.lastIndex || len
          break
        default:
          // if not comment
          if (ch[0] !== '/' || (ch[1] !== '/' && ch[1] !== '*')) {
            // error(v)
            save(val)

            tmp = ['']
            RX_FOR_ANOTHER.lastIndex = --RX_FOR_PARSING.lastIndex
            for (; (val = RX_FOR_ANOTHER.exec(text)); ) {
              if (val[5]) {
                --RX_FOR_ANOTHER.lastIndex
                break
              } else {
                tmp.push(
                  val[1] || val[2]
                    ? fromCharCode(toInt(val[1] || val[2], 16))
                    : val[4] || META_SYMBOLS[val[3]] || val[3] || ''
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
            } else if (ch[0] === '-' && ch[1]) {
              val = (tmp = -ch.slice(1)) === tmp || ch === '-NaN' ? tmp : ch
            } else if (ch[0] === '+' && ch[1]) {
              val = (tmp = +ch.slice(1)) === tmp || ch === '+NaN' ? tmp : ch
            } else {
              val = ch && ((tmp = +ch) === tmp || ch === 'NaN') ? tmp : ch
            }
          }
      }
    }
    save(val)

    if (env.length) error('Missing closing brackets at the end')

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
