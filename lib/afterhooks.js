

class RestAfterHooks {

  static stripNulls(fields) {
    if (!fields || !fields.length) {
      return (req, res, next) => {
        if (req.db.data) {
          if (Array.isArray(req.db.data)) {
            for(let r=0; r < req.db.data.length; r++) {
              for(let f of Object.keys(req.db.data[r])) {
                if (f in req.db.data[r] && req.db.data[r][f] === null) {
                  delete req.db.data[r][f]
                }
              }
            }            
          } else {    
            for(let f of Object.keys(req.db.data)) {
              if (f in req.db.data && req.db.data[f] === null) {
                delete req.db.data[f]
              }
            }            
          }
        }      
        next()
      }
    } else {
      return (req, res, next) => {
        if (req.db.data) {
          if (Array.isArray(req.db.data)) {
            for(let r=0; r < req.db.data.length; r++) {
              for(let f of fields) {
                if (f in req.db.data[r] && req.db.data[r][f] === null) {
                  delete req.db.data[r][f]
                }
              }
            }            
          } else {
            for(let f of fields) {
              if (f in req.db.data && req.db.data[f] === null) {
                delete req.db.data[f]
              }
            }    
          }
        }      
        next()
      }
    }
  }  

  static stripFields(fields) {
    if (!fields || !fields.length) throw new TypeError("The fields parameter must be an array")
    return (req, res, next) => {
 
      if (req.db.data) {
        if (Array.isArray(req.db.data)) {
          for(let r=0; r < req.db.data.length; r++) {
            for(let f of fields) {
              delete req.db.data[r][f]
            }
          } 
        } else {
          for(let f of fields) {
            delete req.db.data[f]
          }
        }
      }
      
      next()
    }    
  }  



}


module.exports = RestAfterHooks
