

class RestBeforeHooks {

  // converts ISO date string to Date object
  static isoToDate(fields) {
    let fieldSet = new Set(fields)
    if (!fields || !fields.length) throw new TypeError("The fields parameter must be an array")
    return (req, res, next) => {
      if (req.body) {
        if (Array.isArray(req.body)) {
          for(let i=0; i < req.body.length; i++) {
            let item = req.body[i]
            let field = item.field || item.column
            if (field && fieldSet.has(field)) {
              if (item.value) {
                if (Array.isArray(item.value)) {
                  for(let a=0; a < item.value.length; a++) {
                    let n = Date.parse(item.value[a])
                    if (isNaN(n)) next(new TypeError(`Unable to parse the ${f} field`))
                    item.value[a] = new Date(n)                        
                  }
                } else {
                  let n = Date.parse(item.value)
                  if (isNaN(n)) next(new TypeError(`Unable to parse the ${f} field`))
                  item.value = new Date(n)    
                }
              }
            }
          }
        } else {
          for(let f of fields) {
            let val = req.body[f]
            if (!val) continue
            let n = Date.parse(val)
            if (isNaN(n)) next(new TypeError(`Unable to parse the ${f} field`))
            req.body[f] = new Date(n)
          }
        }

      }

      next()
    }
  }


  static stripParams(fields) {
    if (!fields || !fields.length) throw new TypeError("The fields parameter must be an array")
    return (req, res, next) => {
      for(let f of fields) {
        if (f in req.body) delete req.body[f]
      }
      next()
    }
  }  


  static addParam(field, value, always) {
    if (!field) throw new TypeError("The field parameter is required")
    if (value === undefined) throw new TypeError("The value parameter is required")
    always = !!always
    return (req, res, next) => {
      if (always || !(field in req.body)) 
        req.body[field] = value
      next()
    }
  }  


  static allowMethods(methods) {
    if (!methods || !methods.length) throw new TypeError("The methods parameter must be an array")
    let match = new Set()
    for(let i=0; i < methods.length; i++) match.add(methods[i].toLowerCase())

    return (req, res, next) => {
      let parts = req.path.split('/')
      if (parts.length > 0) {
        if (!match.has(parts[parts.length-1].toLowerCase())) {
          return res.status(405).send()
        }
      }
      next()
    }
  }

  static denyMethods(methods) {
    if (!methods || !methods.length) throw new TypeError("The methods parameter must be an array")
    let match = new Set()
    for(let i=0; i < methods.length; i++) match.add(methods[i].toLowerCase())

    return (req, res, next) => {
      let parts = req.path.split('/')
      if (parts.length > 0) {
        if (match.has(parts[parts.length-1].toLowerCase())) {
          return res.status(405).send()
        }
      }
      next()
    }
  }

}


module.exports = RestBeforeHooks
