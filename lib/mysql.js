const EXPIRES_IN = 60000*30

// cache 
const keyCache = { }
const fieldCache = { }
const identityCache = {}


// fetch primarykey
async function getIdentityKeys(pool, table, dbname, expires) {
  if (expires === null || expires === undefined) expires=EXPIRES_IN
  let key = dbname ? `${dbname}.${table}` : table
  let cache = identityCache[key]
  if (!cache || cache.expires < Date.now()) {
    let params = [table]
    let sql = `SELECT COLUMN_NAME FROM information_schema.COLUMNS
        where lower(EXTRA) like '%auto_increment%' and TABLE_NAME = ?  `
    if (dbname) {
      sql += ` AND TABLE_SCHEMA = ? `
      params.push(dbname)
    } else {
      sql += ` AND TABLE_SCHEMA = database()`
    }
    // fetch from database
    let pkeys = await pool.query(sql, params)
    cache = { expires: Date.now()+expires, keys: [] }
    if (pkeys && pkeys.length) {
      for(let key of pkeys) {
        cache.keys.push(key.COLUMN_NAME)
      }
    }
    // update cache
    identityCache[key] = cache
  }
  return cache.keys
}


// fetch primarykey
async function getPrimaryKeys(pool, table, dbname, expires) {
  if (expires === null || expires === undefined) expires=EXPIRES_IN

  let key = dbname ? `${dbname}.${table}` : table
  let cache = keyCache[key]
  if (!cache || cache.expires < Date.now()) {
    let params = [table]
    let sql = `SELECT COLUMN_NAME FROM information_schema.COLUMNS
        where COLUMN_KEY ='PRI' and TABLE_NAME = ?  `
    if (dbname) {
      sql += ` AND TABLE_SCHEMA = ? `
      params.push(dbname)
    } else {
      sql += ` AND TABLE_SCHEMA = database()`
    }
    // fetch from database
    let pkeys = await pool.query(sql, params)
    cache = { expires: Date.now()+expires, keys: [] }
    if (pkeys && pkeys.length) {
      for(let key of pkeys) {
        cache.keys.push(key.COLUMN_NAME)
      }
    }
    // update cache
    keyCache[key] = cache
  }
  return cache.keys
}

// fetch fields 
async function getFields(pool, table, dbname, expires) {
  if (expires === null || expires === undefined) expires=EXPIRES_IN

  let key = dbname ? `${dbname}.${table}` : table
  let cache = fieldCache[key]
  if (!cache || cache.expires < Date.now()) {
    let params = [table]
    let sql = `SELECT COLUMN_NAME FROM information_schema.COLUMNS
        where TABLE_NAME = ?  `
    if (dbname) {
      sql += ` AND TABLE_SCHEMA = ? `
      params.push(dbname)
    } else {
      sql += ` AND TABLE_SCHEMA = database()`
    }
    // fetch from database
    let fields = await pool.query(sql, params)
    cache = { expires: Date.now()+expires, fields: [] }
    if (fields && fields.length) {
      for(let key of fields) {
        cache.fields.push(key.COLUMN_NAME)
      }
    }
    // update cache
    fieldCache[key] = cache
  }
  return cache.fields
}


function requiredFieldError(field, table) {
  return new Error(`The required field [${field}] for table [${table}] was not found in the request`)
}


class RestMySql {

  constructor(table) {
    if (!table) throw new TypeError("A table name is required")
    this.table = table
    this.name = table
    this.expires = EXPIRES_IN
  }

  async all(req, res, next) {  
    if (!req.db || !req.db.pool) throw new TypeError("A database pool was not found (req.db.pool)")

    let sql = null 
    let limit = 200
    if (req.db.name) {
      sql = `SELECT * FROM ${req.db.pool.escapeId(req.db.name)}.${req.db.pool.escapeId(this.table)} LIMIT ${limit} `
    } else {
      sql = `SELECT * FROM ${req.db.pool.escapeId(this.table)} LIMIT ${limit} `
    }

    let results = await req.db.pool.query(sql)
    if (results) {
      delete results.meta
      req.db.data = results
    } else {
      req.db.data = []
    }

    next()
  }
   
  
  async get(req, res, next) {  
    if (!req.db || !req.db.pool) throw new TypeError("A database pool was not found (req.db.pool)")
    let pkeys = await getPrimaryKeys(req.db.pool, this.table, req.db.name, this.expires)
    
    let fields = []
    let params = []
    for(let key of pkeys) {
      fields.push(req.db.pool.escapeId(key)+" = ? ")
      if (key in req.body) params.push(req.body[key])
      else if (key in req.params) params.push(req.params[key])
      else return next(requiredFieldError(key, this.table))
    }

    let sql = null 
    if (req.db.name) {
      sql = `SELECT * FROM ${req.db.pool.escapeId(req.db.name)}.${req.db.pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} `
    } else {
      sql = `SELECT * FROM ${req.db.pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} `
    }

    let results = await req.db.pool.query(sql, params)
    if (results) {
      delete results.meta
      req.db.data = results
    } else {
      req.db.data = []
    }

    next()
  }
    
  async add(req, res, next) {  
    if (!req.db || !req.db.pool) throw new TypeError("A database pool was not found (req.db.pool)")
    let idents = await getIdentityKeys(req.db.pool, this.table, req.db.name, this.expires)
    let columns = await getFields(req.db.pool, this.table, req.db.name, this.expires)

    let fields = []
    let values = []
    let params = []
    if (idents && idents.length) idents = idents[0]
    else idents = ""

    for(let key of columns) {
      if (idents == key) continue
      if (key in req.body) {
        fields.push(req.db.pool.escapeId(key))
        values.push("?")
        params.push(req.body[key])
      } else if (key in req.params) {
        fields.push(req.db.pool.escapeId(key))
        values.push("?")
        params.push(req.params[key])
      }
    }

    let sql = null 
    if (req.db.name) {
      sql = `INSERT INTO ${req.db.pool.escapeId(req.db.name)}.${req.db.pool.escapeId(this.table)} `
          + `(${fields.join(", ")}) VALUES (${values.join(", ")})`
    } else {
      sql = `INSERT INTO ${req.db.pool.escapeId(this.table)} (${fields.join(", ")}) `
          + `VALUES (${values.join(", ")}) `
    }

    req.db.data = await req.db.pool.query(sql, params)
    if (idents) {
      if (req.db.data.insertId) {
        req.db.data[idents] = req.db.data.insertId
      }      
    }
    next()
  }

  async save(req, res, next){  
    if (!req.db || !req.db.pool) throw new TypeError("A database pool was not found (req.db.pool)")
    let pkeys = new Set(await getPrimaryKeys(req.db.pool, this.table, req.db.name, this.expires))
    let idents = new Set(await getIdentityKeys(req.db.pool, this.table, req.db.name, this.expires))
    let columns = await getFields(req.db.pool, this.table, req.db.name, this.expires)

    let fields = []
    let params = []

    for(let key of columns) {
      if (pkeys.has(key)) continue
      if (idents.has(key)) continue
      if (key in req.body) {
        fields.push(req.db.pool.escapeId(key)+" = ?")
        params.push(req.body[key])
      } else if (key in req.params) {
        fields.push(req.db.pool.escapeId(key)+" = ?")
        params.push(req.params[key])
      }
    }

    let where = []
    for(let key of pkeys.values()) {
      where.push(req.db.pool.escapeId(key)+" = ? ")
      if (key in req.body) params.push(req.body[key])
      else if (key in req.params) params.push(req.params[key])
      else return next(requiredFieldError(key, this.table))      
    }

    let sql = null 
    if (req.db.name) {
      sql = `UPDATE ${req.db.pool.escapeId(req.db.name)}.${req.db.pool.escapeId(this.table)} `
          + `SET ${fields.join(", ")} WHERE ${where.join(" AND ")} `
    } else {
      sql = `UPDATE ${req.db.pool.escapeId(this.table)} SET ${fields.join(", ")} `
          + `WHERE ${where.join(" AND ")} `
    }

    req.db.data = await req.db.pool.query(sql, params)

    next()
  }

  async remove(req, res, next) {
    if (!req.db || !req.db.pool) throw new TypeError("A database pool was not found (req.db.pool)")
    let pkeys = await getPrimaryKeys(req.db.pool, this.table, req.db.name, this.expires)
    
    let fields = []
    let params = []
    for(let key of pkeys) {
      fields.push(req.db.pool.escapeId(key)+" = ? ")
      if (key in req.body) params.push(req.body[key])
      else if (key in req.params) params.push(req.params[key])
      else return next(requiredFieldError(key, this.table))
    }

    let sql = null 
    if (req.db.name) {
      sql = `DELETE FROM ${req.db.pool.escapeId(req.db.name)}.${req.db.pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} `
    } else {
      sql = `DELETE FROM ${req.db.pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} `
    }

    req.db.data = await req.db.pool.query(sql, params)

    next()
  }


  async find(req, res, next) {  
    if (!req.db || !req.db.pool) throw new TypeError("A database pool was not found (req.db.pool)")
    
    let fields = []
    let params = []
    let search = [] 

    if (Array.isArray(req.body)) {
      search = req.body
    } else {
      if ("search" in req.body) search = req.body["search"]
      else if ("where" in req.body) search = req.body["where"]
      else if ("find" in req.body) search = req.body["find"]  
    }

    for(let item of search) {
      let field = item.field || item.column
      item.op = item.op.toLowerCase()
      switch(item.op) {
        case "=":
        case ">=":
        case "<=":
        case ">":
        case "<":
        case "<>":
          fields.push(req.db.pool.escapeId(field)+` ${item.op} ? `)
          params.push(item.value)
          break
        case "!=":
          fields.push(req.db.pool.escapeId(field)+` <> ? `)
          params.push(item.value)
          break
        case "startswith":
          if (typeof item.value !== "string") return next(new TypeError("The startsWith operator only works with text values"))
          fields.push(req.db.pool.escapeId(field)+` LIKE ? `)
          params.push('%'+item.value)
          break
        case "endswith":
          if (typeof item.value !== "string") return next(new TypeError("The endsWith operator only works with text values"))
          fields.push(req.db.pool.escapeId(field)+` LIKE ? `)
          params.push(item.value+'%')
          break
        case "contains":
          if (typeof item.value !== "string") return next(new TypeError("The contains operator only works with text values"))
          fields.push(req.db.pool.escapeId(field)+` LIKE ? `)
          params.push('%'+item.value+'%')
          break
        case "between":
          if (!Array.isArray(item.value)) return next(new TypeError("The between operator only works with array values"))
          if (item.value.length != 2) return next(new TypeError("The between operator requires two values only"))
          fields.push(req.db.pool.escapeId(field)+` BETWEEN ? AND ? `)
          params.push(item.value[0])
          params.push(item.value[1])
          break
          
        default:
          return next(new TypeError(`The ${item.op} operator is not supported.`))
      }
    }

    let limit = 200
    let sql = null 
    if (req.db.name) {
      sql = `SELECT * FROM ${req.db.pool.escapeId(req.db.name)}.${req.db.pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} LIMIT ${limit} `
    } else {
      sql = `SELECT * FROM ${req.db.pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} LIMIT ${limit} `
    }
    console.log(sql, params)

    let results = await req.db.pool.query(sql, params)
    if (results) {
      delete results.meta
      req.db.data = results
    } else {
      req.db.data = []
    }

    next()
  }


  static create(tables) {
    if (!tables) throw new TypeError("A tables parameter is required")
    if (!Array.isArray(tables)) throw new TypeError("The tables parameter must be an array")
    let results = []
    for(let table of tables) {
      results.push(new RestMySql(table))
    }
    return results
  }

  
}


module.exports = RestMySql