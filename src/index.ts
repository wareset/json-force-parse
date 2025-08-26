// const RX_JSON = /\{|\}|\[|\]|,|:|"(?:[^\\"]|\\.)*"|[^{}[\],:"\s]+/g
// \r\n\u2028\u2029
const RX_JSON =
  /\{|\}|\[|\]|,|:|"|\/\/[^\r\n]*|\/\*[^]*?(?:\*\/|$)|[^{}[\],:"/\s]+/g

const META_SYMBOLS: any = { b: '\b', t: '\t', n: '\n', f: '\f', r: '\r' }

/*@__NO_SIDE_EFFECTS__*/
export default function parseJson(
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
  },
  createObjectsWithPrototype?: boolean
) {
  let res: any

  if (s !== void 0) {
    s += ''
    RX_JSON.lastIndex = 0

    function error() {
      throw {
        error: 'Not valid JSON',
        index,
        slice: s.slice(0, index),
        value: cur.o,
      }
    }

    const root = {}
    let cur: { t: '[' | '{'; k?: any; o: any; p?: any } = { t: '{', o: root }
    let env: (typeof cur)[] = []

    const reviverList = reviver && ([] as [any, any, any, any][])

    let index = 0

    let obj: any
    let key: any = ''
    let source: any
    let val: any

    const toInt = parseInt
    const charCode = String.fromCharCode
    const oc =
      (!createObjectsWithPrototype && Object.create) ||
      function () {
        return {}
      }

    const save = function (v: any, _reviverList?: typeof reviverList) {
      let k: any
      if (v !== void 0) {
        cur.o[
          (k = key !== void 0 ? key : cur.t === '[' ? cur.o.length : error())
        ] = v
        if (_reviverList) _reviverList.push([cur.o, k, v, { source }])
      }
      key = val = source = void 0
      return k
    }

    let m: RegExpExecArray | null, c: string
    for (; (m = RX_JSON.exec(s)); ) {
      index = m.index
      switch ((c = m[0])[0]) {
        case ':':
          if (key !== void 0) error()
          key = val
          val = void 0
          break
        case ',':
          save(val, reviverList)
          break
        case '[':
          env.push(cur)
          cur = { t: c as '[', k: save((obj = [])), o: obj, p: cur.o }
          break
        case '{':
          env.push(cur)
          cur = { t: c as '{', k: save((obj = oc(null))), o: obj, p: cur.o }
          break
        case ']':
        case '}':
          save(val, reviverList)
          if ((cur.t === '{') !== (c === '}')) error()
          if (reviverList && cur.p) reviverList.push([cur.p, cur.k, cur.o, {}])
          cur = env.pop()!
          break
        case '"': {
          if (val !== void 0) error()
          const raw = ['']
          let i = m.index
          for (let l = s.length, w: string; ++i < l && (w = s[i]) !== c; )
            raw.push(
              w !== '\\'
                ? w
                : (w = s[++i]) in META_SYMBOLS
                  ? META_SYMBOLS[w]
                  : w === 'u'
                    ? charCode(toInt(s[++i] + s[++i] + s[++i] + s[++i], 16))
                    : w || ''
            )
          RX_JSON.lastIndex = ++i
          val = raw.join('')
          if (reviverList) source = s.slice(m.index, i)
          break
        }
        case '/':
          break
        default:
          if (val !== void 0) error()
          source = c
          val =
            c === 'false'
              ? false
              : c === 'true'
                ? true
                : c === 'null'
                  ? null
                  : isNaN((val = +c)) && c !== 'NaN'
                    ? c
                    : val
      }
    }

    res = env.length > 0 ? error() : '' in root ? root[''] : val

    if (reviverList) {
      val = reviverList.length
      if (val === 0) reviverList[val++] = [{ '': res }, '', res, { source }]

      for (let i = 0; i < val; ++i) {
        ;(obj = reviverList[i]), (env = obj[0]), (key = '' + obj[1])
        env[key] = (reviver as any).call(env, key, obj[2], obj[3])
      }
      res = reviverList[val - 1][0]['']
    }
  }

  return res
}
