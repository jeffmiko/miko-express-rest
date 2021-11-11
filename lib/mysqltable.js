const {
  getIdentityKeys,
  getPrimaryKeys,
  getFields,
  requiredFieldError,
  EXPIRES_IN,
} = require("./mysqlcache")



class RestMySqlTable {

  constructor(table) {
    if (!table) throw new TypeError("A table name is required")
    this.table = table
    this.name = table
    this.expires = EXPIRES_IN
  }

  async all(pool, dbname, limit) {  
    if (!pool) throw new TypeError("A database pool was not provided")

    let sql = null 
    if (!limit) limit = 200
    if (dbname) {
      sql = `SELECT * FROM ${pool.escapeId(dbname)}.${pool.escapeId(this.table)} LIMIT ${limit} `
    } else {
      sql = `SELECT * FROM ${pool.escapeId(this.table)} LIMIT ${limit} `
    }

    let results = await pool.query(sql)
    if (results) {
      delete results.meta
      return results
    } else {
      return []
    }

  }
   
  
  async get(values, pool, dbname) {  
    if (!pool) throw new TypeError("A database pool was not provided")
    let pkeys = await getPrimaryKeys(pool, this.table, dbname, this.expires)
    
    let fields = []
    let params = []
    for(let key of pkeys) {
      fields.push(pool.escapeId(key)+" = ? ")
      if (key in values) params.push(values[key])
      else return next(requiredFieldError(key, this.table))
    }

    let sql = null 
    if (dbname) {
      sql = `SELECT * FROM ${pool.escapeId(dbname)}.${pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} `
    } else {
      sql = `SELECT * FROM ${pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} `
    }

    let results = await pool.query(sql, params)
    if (results) {
      delete results.meta
      return results
    } else {
      return []
    }

  }
    
  async add(values, pool, dbname) {  
    if (!pool) throw new TypeError("A database pool was not provided")
    let idents = await getIdentityKeys(pool, this.table, dbname, this.expires)
    let columns = await getFields(pool, this.table, dbname, this.expires)

    let fields = []
    let questions = []
    let params = []
    if (idents && idents.length) idents = idents[0]
    else idents = ""

    for(let key of columns) {
      if (idents == key) continue
      if (key in values) {
        fields.push(pool.escapeId(key))
        questions.push("?")
        params.push(values[key])
      }
    }

    let sql = null 
    if (dbname) {
      sql = `INSERT INTO ${pool.escapeId(dbname)}.${pool.escapeId(this.table)} `
          + `(${fields.join(", ")}) VALUES (${questions.join(", ")})`
    } else {
      sql = `INSERT INTO ${pool.escapeId(this.table)} (${fields.join(", ")}) `
          + `VALUES (${questions.join(", ")}) `
    }

    let data = await pool.query(sql, params)
    if (idents) {
      if (data.insertId) {
        data[idents] = data.insertId
      }      
    }

  }

  async save(values, pool, dbname){  
    if (!pool) throw new TypeError("A database pool was not provided")
    let pkeys = new Set(await getPrimaryKeys(pool, this.table, dbname, this.expires))
    let idents = new Set(await getIdentityKeys(pool, this.table, dbname, this.expires))
    let columns = await getFields(pool, this.table, dbname, this.expires)

    let fields = []
    let params = []

    for(let key of columns) {
      if (pkeys.has(key)) continue
      if (idents.has(key)) continue
      if (key in values) {
        fields.push(pool.escapeId(key)+" = ?")
        params.push(values[key])
      }
    }

    let where = []
    for(let key of pkeys.values()) {
      where.push(pool.escapeId(key)+" = ? ")
      if (key in values) params.push(values[key])
      else return next(requiredFieldError(key, this.table))      
    }

    let sql = null 
    if (dbname) {
      sql = `UPDATE ${pool.escapeId(dbname)}.${pool.escapeId(this.table)} `
          + `SET ${fields.join(", ")} WHERE ${where.join(" AND ")} `
    } else {
      sql = `UPDATE ${pool.escapeId(this.table)} SET ${fields.join(", ")} `
          + `WHERE ${where.join(" AND ")} `
    }

    return await pool.query(sql, params)

  }

  async remove(values, pool, dbname) {
    if (!pool) throw new TypeError("A database pool was not provided")
    let pkeys = await getPrimaryKeys(pool, this.table, dbname, this.expires)
    
    let fields = []
    let params = []
    for(let key of pkeys) {
      fields.push(pool.escapeId(key)+" = ? ")
      if (key in values) params.push(values[key])
      else return next(requiredFieldError(key, this.table))
    }

    let sql = null 
    if (dbname) {
      sql = `DELETE FROM ${pool.escapeId(dbname)}.${pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} `
    } else {
      sql = `DELETE FROM ${pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} `
    }

    return await pool.query(sql, params)

  }


  async find(values, pool, dbname) {  
    if (!pool) throw new TypeError("A database pool was not provided")
    
    let fields = []
    let params = []
    let search = [] 

    if (Array.isArray(values)) {
      search = values
    } else {
      if ("search" in values) search = values["search"]
      else if ("where" in values) search = values["where"]
      else if ("find" in values) search = values["find"]  
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
          fields.push(pool.escapeId(field)+` ${item.op} ? `)
          params.push(item.value)
          break
        case "!=":
          fields.push(pool.escapeId(field)+` <> ? `)
          params.push(item.value)
          break
        case "startswith":
          if (typeof item.value !== "string") return next(new TypeError("The startsWith operator only works with text values"))
          fields.push(pool.escapeId(field)+` LIKE ? `)
          params.push('%'+item.value)
          break
        case "endswith":
          if (typeof item.value !== "string") return next(new TypeError("The endsWith operator only works with text values"))
          fields.push(pool.escapeId(field)+` LIKE ? `)
          params.push(item.value+'%')
          break
        case "contains":
          if (typeof item.value !== "string") return next(new TypeError("The contains operator only works with text values"))
          fields.push(pool.escapeId(field)+` LIKE ? `)
          params.push('%'+item.value+'%')
          break
        case "between":
          if (!Array.isArray(item.value)) return next(new TypeError("The between operator only works with array values"))
          if (item.value.length != 2) return next(new TypeError("The between operator requires two values only"))
          fields.push(pool.escapeId(field)+` BETWEEN ? AND ? `)
          params.push(item.value[0])
          params.push(item.value[1])
          break
          
        default:
          return next(new TypeError(`The ${item.op} operator is not supported.`))
      }
    }

    let limit = 200
    let sql = null 
    if (dbname) {
      sql = `SELECT * FROM ${pool.escapeId(dbname)}.${pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} LIMIT ${limit} `
    } else {
      sql = `SELECT * FROM ${pool.escapeId(this.table)} WHERE ${fields.join(" AND ")} LIMIT ${limit} `
    }
    console.log(sql, params)

    let results = await pool.query(sql, params)
    if (results) {
      delete results.meta
      return results
    } else {
      return []
    }

  
  }


  static create(tables) {
    if (!tables) throw new TypeError("A tables parameter is required")
    if (!Array.isArray(tables)) throw new TypeError("The tables parameter must be an array")
    let results = []
    for(let table of tables) {
      results.push(new RestMySqlTable(table))
    }
    return results
  }

  
}


module.exports = RestMySqlTable