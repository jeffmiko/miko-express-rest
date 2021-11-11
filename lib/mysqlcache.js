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

module.exports = {
  getIdentityKeys,
  getPrimaryKeys,
  getFields,
  requiredFieldError,
  EXPIRES_IN,
}