

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



