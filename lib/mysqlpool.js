

class RestMySqlPromisePool {
  constructor(pool) {
    this.pool = pool
  }

  async query(sql, values) {
    return new Promise((resolve, reject) => {
      if (values) {
        this.pool.query(sql, values, (err, rows )=> {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      } else {
        this.pool.query(sql, (err, rows )=> {
          if (err) {
            reject(err)
          } else {
            delete rows.meta
            resolve(rows)
          }
        })
      }
    })
  }

  escape(value) {
    return this.pool.escape(value)
  }

  escapeId(value) {
    return this.pool.escapeId(value)
  }

}

module.exports = RestMySqlPromisePool