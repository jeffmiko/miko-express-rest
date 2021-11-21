const { hrtime } = require('process')
const emptyfn = (()=> {})
const CACHE_TIMEOUT = 4000

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

module.exports.addBodyDate = function addBodyDate(field, offset, overwrite) {
  return ((req, res, next) => {
    if (overwrite || !(field in req.body)) 
      req.body[field] = new Date(Date.now()+offset)
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

function getRedisKey(req, prefix, keys, sep) {
  let params = Object.assign(req.query, req.body, req.params)
  let items = [prefix]
  for(let key of keys) {
    if (key in params) {
      items.push(params[key])
    }
  }
  return items.join(sep)
}

module.exports.getCache = function(redis, prefix, keys, sep) {  
  if (!redis) throw new TypeError("A redis client is required")
  if (!prefix) throw new TypeError("A prefix is required")
  if (!keys) throw new TypeError("One or more keys are required")
  if (!sep) sep = '-'
  if (!Array.isArray(keys)) keys = [keys]
  return ((req, res, next) => {
    if (!redis) return next()
    let timer = setTimeout(()=> {
      if (req.timing) req.timing.cache = CACHE_TIMEOUT
      next()
      next = emptyfn
    }, CACHE_TIMEOUT)
    let key = getRedisKey(req, prefix, keys, sep)
    // time the cache request
    let startTime = hrtime.bigint()
    redis.get(key, function(err, reply) {
      clearTimeout(timer)
      if (!err && reply !== null) {
        try {
          res.data = JSON.parse(reply)
          res.status(200)            
        } catch { }
        let endTime = hrtime.bigint()
        if (req.timing) req.timing.cache = Number(endTime-startTime)/1000000
      }
      next()
    });
  }) 
}

module.exports.delCache = function(redis, prefix, keys, sep) {  
  if (!redis) throw new TypeError("A redis client is required")
  if (!prefix) throw new TypeError("A prefix is required")
  if (!keys) throw new TypeError("One or more keys are required")
  if (!sep) sep = '-'
  if (!Array.isArray(keys)) keys = [keys]
  return ((req, res, next) => {
    if (!redis) return next()
    let timer = setTimeout(()=> {
      if (req.timing) req.timing.cache = CACHE_TIMEOUT
      next()
      next = emptyfn
    }, CACHE_TIMEOUT)
    let key = getRedisKey(req, prefix, keys, sep)
    // time the cache request
    let startTime = hrtime.bigint()
    redis.del(key, function(err, reply) {
      clearTimeout(timer)
      let endTime = hrtime.bigint()
      if (req.timing) req.timing.cache = Number(endTime-startTime)/1000000
      next()
    });
  }) 
}


