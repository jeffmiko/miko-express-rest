

module.exports.stripFields = function(fields) {
  if (!Array.isArray(fields)) fields = [fields]
  return ((data) => {
    if (!data) return
    if (Array.isArray(data)) {
      for(let i=0; i < data.length; i++) {
        for(let fld of fields) {
          if (fld in data[i]) delete data[i][fld]
        }  
      }
    } else {
      for(let fld of fields) {
        if (fld in data) delete data[fld]
      }
    }
  })
}


module.exports.stripNulls = function(fields) {
  if (!fields || fields.length==0) {
    return ((data) => {
      if (!data) return
      if (Array.isArray(data)) {
        for(let i=0; i < data.length; i++) {
          for(let fld of Object.keys(data[i])) {
            if (data[i][fld]===null) delete data[i][fld]
          }  
        }
      } else {
        for(let fld of Object.keys(data)) {
          if (data[fld]===null) delete data[fld]
        }
      }
    })
  }  
  if (!Array.isArray(fields)) fields = [fields]
  return ((data) => {
    if (!data) return
    if (Array.isArray(data)) {
      for(let i=0; i < data.length; i++) {
        for(let fld of fields) {
          if (data[i][fld]===null) delete data[i][fld]
        }  
      }
    } else {
      for(let fld of fields) {
        if (data[fld]===null) delete data[fld]
      }
    }
  })
}


module.exports.stripEmpty = function(fields) {
  if (!fields || fields.length==0) {
    return ((data) => {
      if (!data) return
      if (Array.isArray(data)) {
        for(let i=0; i < data.length; i++) {
          for(let fld of Object.keys(data[i])) {
            if (data[i][fld]===null) delete data[i][fld]
            else if (data[i][fld]==='') delete data[i][fld]
          }  
        }
      } else {
        for(let fld of Object.keys(data)) {
          if (data[fld]===null) delete data[fld]
          else if (data[fld]==='') delete data[fld]
        }
      }
    })
  }
  if (!Array.isArray(fields)) fields = [fields]
  return ((data) => {
    if (!data) return
    if (Array.isArray(data)) {
      for(let i=0; i < data.length; i++) {
        for(let fld of fields) {
          if (data[i][fld]===null) delete data[i][fld]
          else if (data[i][fld]==='') delete data[i][fld]
        }  
      }
    } else {
      for(let fld of fields) {
        if (data[fld]===null) delete data[fld]
        else if (data[fld]==='') delete data[fld]
      }
    }
  })
}



