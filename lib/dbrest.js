const express = require("express")
const {dbfactory} = require("miko-db")
const { hrtime } = require('process')

function firstHook(req, res, next) {
  req.timing = { start: hrtime.bigint() }
  next()
}

function lastHook(req, res, next) {
  let endTime = hrtime.bigint()
  let total = Number(endTime-req.timing.start)/1000000
  let dbtime = 0
  if (req.timing.dbstart && req.timing.dbstop) {
    dbtime = Number(req.timing.dbstop-req.timing.dbstart)/1000000
  }
  let cache = req.timing.cache ? `, cache;${req.timing.cache}` : ''
  res.set('Server-Timing', `total;dur=${total}, db;dur=${dbtime}${cache}`)
  if (res.data)
    res.json(res.data)
  else 
    res.send()
}



module.exports = function dbrest(poolOrConnection) {
  const db = dbfactory(poolOrConnection)
  const tableList = []
  const globalHooks = { all: [], get: [], post: [], patch: [], delete: [], data: [] }
  const tableHooks = { }
  

  function createRouter(table) {
    const router = express.Router({mergeParams: true})

    const hooks = table.name in tableHooks ? tableHooks[table.name]
                                           : { all: [], get: [], post: [], patch: [], delete: [], data: [] }
              
    const dbtbl = db.getTable(table.name, table.schema)    
    const dataHooks = [...globalHooks.data, ...hooks.data]                                       
                                           
    // get all
    router.get("/", [firstHook, ...globalHooks.all, ...globalHooks.get, ...hooks.all, ...hooks.get, async (req, res, next) => {
      if (res.data !== undefined) return next()
      let data = null
      let limit = req.get('sql-limit')||req.get('db-limit')
      req.timing.dbstart = hrtime.bigint()
      if (limit && !isNaN(limit)) {
        data = await dbtbl.find(Object.assign(req.query, req.params), parseInt(limit))
      } else {
        data = await dbtbl.find(Object.assign(req.query, req.params))
      }
      req.timing.dbstop = hrtime.bigint()
      res.data = data
      res.status(200)
      next()
    }, ...dataHooks, lastHook])

    // get one
    router.get( `/:${table.pkey}(\\d+)`, [firstHook, ...globalHooks.all, ...globalHooks.get, ...hooks.all, ...hooks.get, async (req, res, next) => {
      if (res.data !== undefined) return next()
      req.timing.dbstart = hrtime.bigint()
      let data = await dbtbl.get(req.params)
      req.timing.dbstop = hrtime.bigint()
      if (!data) {
        res.status(404)
        data = { table, method: req.method, url: req.originalUrl, params: req.params, query: req.query }
      }
      res.data = data
      res.status(200)
      next()
    }, ...dataHooks, lastHook])

    // add
    router.post("/", [firstHook, ...globalHooks.all, ...globalHooks.post, ...hooks.all, ...hooks.post, async (req, res, next) => {
      if (res.data !== undefined) return next()
      req.timing.dbstart = hrtime.bigint()
      let data = await dbtbl.add(Object.assign(req.params, req.body))
      req.timing.dbstop = hrtime.bigint()
      if (data && (data.affectedRows || data.insertId)) {
        res.status(200)
      } else {
        res.status(409)
        data = { table, method: req.method, url: req.originalUrl, params: req.params, body: req.body }
      }
      res.data = data
      next()
    }, ...dataHooks, lastHook])

    // delete one
    router.delete( `/:${table.pkey}(\\d+)`, [firstHook, ...globalHooks.all, ...globalHooks.delete, ...hooks.all, ...hooks.delete, async (req, res, next) => {
      if (res.data !== undefined) return next()
      req.timing.dbstart = hrtime.bigint()
      let data = await dbtbl.remove(req.params)
      req.timing.dbstop = hrtime.bigint()
      if (data && data.affectedRows) {
        res.status(200)
      } else  {
        res.status(404)
        data = { table, method: req.method, url: req.originalUrl, params: req.params }
      }
      res.data = data
      next()
    }, ...dataHooks, lastHook])
  
    // update/modify one
    router.patch( `/:${table.pkey}(\\d+)`, [firstHook, ...globalHooks.all, ...globalHooks.patch, ...hooks.all, ...hooks.patch, async (req, res, next) => {
      if (res.data !== undefined) return next()
      req.timing.dbstart = hrtime.bigint()
      let data = await dbtbl.save(Object.assign(req.params, req.body))
      req.timing.dbstop = hrtime.bigint()
      if (data && (data.affectedRows)) {
        res.status(200)
      } else if (data && 'affectedRows' in data) {
        res.status(204)
      } else {
        res.status(409)
        data = { table, method: req.method, url: req.originalUrl, params: req.params, body: req.body }
      }
      res.data = data
      next()
    }, ...dataHooks, lastHook])


    return router
  }


  function createRoutes() {
    const routers = {}

    let tablesByPK = Object.assign({}, ...tableList.map((x) => ({[x.pkey]: x})));

    tableList.sort((a, b) => {
      // process all tables with fewest foreign keys first
      if (a.fkeys.length > b.fkeys.length) return 1
      if (a.fkeys.length < b.fkeys.length) return -1
      // if equal foreign keys then process alpha by name
      if (a.name > b.name) return 1
      if (a.name < b.name) return -1
      return 0
    })

    for(let table of tableList) {
      const router = createRouter(table)
      routers[table.name] = router
    } 

    // stack routes 
    for(let table of tableList) {
      //if (table.name != "resources" && table.name != "contexts") continue

      for(let fk of table.fkeys) {
        let parent = tablesByPK[fk]
        if (parent) {
          //console.log(parent.name, table.name, fk)    
          let prouter = routers[parent.name]
          let crouter = routers[table.name]
          prouter.use(`/:${parent.pkey}(\\d+)/${table.name}`, crouter)
        }
      }
    } 

    const router = express.Router({mergeParams: true})

    for(let table of tableList) {
      let path = table.path || table.name
      if (path.startsWith('/')) path = path.substr(1)
      router.use(`/${path}`, routers[table.name])
    }

    return router
  }


  function addGlobalHooks(options = {all: [], get: [], post: [], patch: [], delete: [], data: []}) {
    if (options.all && options.all.length) globalHooks.all.push(...options.all)
    if (options.get && options.get.length) globalHooks.get.push(...options.get)
    if (options.post && options.post.length) globalHooks.post.push(...options.post)
    if (options.patch && options.patch.length) globalHooks.patch.push(...options.patch)
    if (options.delete && options.delete.length) globalHooks.delete.push(...options.delete)  
    if (options.data && options.data.length) globalHooks.data.push(...options.data)  
  }

  
  function addTableHooks(options = {table, all: [], get: [], post: [], patch: [], delete: [], data: []}) {
    if (!(options.table in tableHooks)) {
      tableHooks[options.table] = { all: [], get: [], post: [], patch: [], delete: [], data: [] }
    }
    const hooks = tableHooks[options.table]
    if (options.all && options.all.length) hooks.all.push(...options.all)
    if (options.get && options.get.length) hooks.get.push(...options.get)
    if (options.post && options.post.length) hooks.post.push(...options.post)
    if (options.patch && options.patch.length) hooks.patch.push(...options.patch)
    if (options.delete && options.delete.length) hooks.delete.push(...options.delete)
    if (options.data && options.data.length) hooks.data.push(...options.data)
  }


  function addTable({name, pkey, fkeys, schema, path}) {
    if (!name) throw new TypeError("A name is required for all tables")
    if (!pkey) throw new TypeError(`A pkey (primmary key) is required for table ${name}`)
    if (!fkeys) fkeys = []
    tableList.push({name, pkey, fkeys, schema, path})
  }


  function addTables(tables) {
    for(let table of tables) {
      addTable(table)
    }
  }


  return {
    addTables, addTable, createRoutes,
    addTableHooks, addGlobalHooks,
  }


}

