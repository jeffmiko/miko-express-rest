


module.exports.stripParam = function stripParam(fields) {
  if (!Array.isArray(fields)) fields = [fields]
  return ((req, res, next) => {
    for(let f of fields) {
      if (f in req.params) delete req.params[f]
    }
    next()
  })
}

module.exports.stripBody = function stripBody(fields) {
  if (!Array.isArray(fields)) fields = [fields]
  return ((req, res, next) => {
    for(let f of fields) {
      if (f in req.body) delete req.body[f]
    }
    next()
  })
}

module.exports.stripQuery = function stripQuery(fields) {
  if (!Array.isArray(fields)) fields = [fields]
  return ((req, res, next) => {
    for(let f of fields) {
      if (f in req.query) delete req.query[f]
    }
    next()
  })
}

module.exports.stripAll = function stripAll(fields) {
  if (!Array.isArray(fields)) fields = [fields]
  return ((req, res, next) => {
    for(let f of fields) {
      if (f in req.params) delete req.params[f]
      if (f in req.body) delete req.body[f]
      if (f in req.query) delete req.query[f]
    }
    next()
  })
}

module.exports.addParam = function addParam(field, value, overwrite) {
  return ((req, res, next) => {
    if (overwrite || !(field in req.params)) 
      req.params[field] = value
    next()
  })
}

module.exports.addBody = function addBody(field, value, overwrite) {
  return ((req, res, next) => {
    if (overwrite || !(field in req.body)) 
      req.body[field] = value
    next()
  })
}

module.exports.addQuery = function addQuery(field, value, overwrite) {
  return ((req, res, next) => {
    if (overwrite || !(field in req.query)) 
      req.query[field] = value
    next()
  })
}

module.exports.isoToDate = function isoToDate(fields) {
  if (!Array.isArray(fields)) fields = [fields]
  return ((req, res, next) => {
    for(let fld of fields) {
      for(let dict of [req.body, req.params, req.query]) {
        let val = dict[fld]
        if (val && typeof val === "string") {
          let dt = new Date(val)
          if (isNaN(dt.getTime())) 
            return next(new TypeError(`Unable to ${val} to a date for the ${fld} field`))
          dict[fld] = dt
        }
      }
    }
    next()
  })
}

