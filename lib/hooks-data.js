const emptyfn = (()=> {})
const CACHE_TIMEOUT = 4000


module.exports.stripFields = function(fields) {
  if (!Array.isArray(fields)) fields = [fields]
  return ((req, res, next) => {
    if (!res.statusCode || res.statusCode >= 400) return next()
    if (!res.data) return next()
    if (Array.isArray(res.data)) {
      for(let i=0; i < res.data.length; i++) {
        for(let fld of fields) {
          if (fld in res.data[i]) delete res.data[i][fld]
        }  
      }
    } else {
      for(let fld of fields) {
        if (fld in res.data) delete res.data[fld]
      }
    }
    next()
  })
}


module.exports.stripNulls = function(fields) {
  if (!fields || fields.length==0) {
    return ((req, res, next) => {
      if (!res.statusCode || res.statusCode >= 400) return next()
      if (!res.data) return next()
      if (Array.isArray(res.data)) {
        for(let i=0; i < res.data.length; i++) {
          for(let fld of Object.keys(res.data[i])) {
            if (res.data[i][fld]===null) delete res.data[i][fld]
          }  
        }
      } else {
        for(let fld of Object.keys(res.data)) {
          if (res.data[fld]===null) delete res.data[fld]
        }
      }
      next()
    })
  }  
  if (!Array.isArray(fields)) fields = [fields]
  return ((req, res, next) => {
    if (!res.statusCode || res.statusCode >= 400) return next()
    if (!res.data) return next()
    if (Array.isArray(res.data)) {
      for(let i=0; i < res.data.length; i++) {
        for(let fld of fields) {
          if (res.data[i][fld]===null) delete res.data[i][fld]
        }  
      }
    } else {
      for(let fld of fields) {
        if (res.data[fld]===null) delete res.data[fld]
      }
    }
    next()
  })
}


module.exports.stripEmpty = function(fields) {
  if (!fields || fields.length==0) {
    return ((req, res, next) => {
      if (!res.statusCode || res.statusCode >= 400) return next()
      if (!res.data) return next()
      if (Array.isArray(res.data)) {
        for(let i=0; i < res.data.length; i++) {
          for(let fld of Object.keys(res.data[i])) {
            if (res.data[i][fld]===null) delete res.data[i][fld]
            else if (res.data[i][fld]==='') delete res.data[i][fld]
          }  
        }
      } else {
        for(let fld of Object.keys(res.data)) {
          if (res.data[fld]===null) delete res.data[fld]
          else if (res.data[fld]==='') delete res.data[fld]
        }
      }
      next()
    })
  }
  if (!Array.isArray(fields)) fields = [fields]
  return ((req, res, next) => {
    if (!res.statusCode || res.statusCode >= 400) return next()
    if (!res.data) return next()
    if (Array.isArray(res.data)) {
      for(let i=0; i < res.data.length; i++) {
        for(let fld of fields) {
          if (res.data[i][fld]===null) delete res.data[i][fld]
          else if (res.data[i][fld]==='') delete res.data[i][fld]
        }  
      }
    } else {
      for(let fld of fields) {
        if (res.data[fld]===null) delete res.data[fld]
        else if (res.data[fld]==='') delete res.data[fld]
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

module.exports.setCache = function(redis, prefix, keys, sep) {  
  if (!redis) throw new TypeError("A redis client is required")
  if (!prefix) throw new TypeError("A prefix is required")
  if (!keys) throw new TypeError("One or more keys are required")
  if (!sep) sep = '-'
  if (!Array.isArray(keys)) keys = [keys]
  return ((req, res, next) => {
    if (!res.statusCode || res.statusCode >= 400) return next()
    if (!res.data) return next()
    let timer = setTimeout(()=> {
      if (req.timing) req.timing.cache = CACHE_TIMEOUT
      next()
      next = emptyfn
    }, CACHE_TIMEOUT)
    let key = getRedisKey(req, prefix, keys, sep)
    // time the cache request
    let startTime = hrtime.bigint()
    let json = JSON.stringify(res.data)
    redis.set(key, json, function(err, reply) {
      clearTimeout(timer)
      let endTime = hrtime.bigint()
      if (req.timing) req.timing.cache = Number(endTime-startTime)/1000000
      next()
    });
  }) 
}

