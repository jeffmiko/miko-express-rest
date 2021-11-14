const express = require("express")
const {dbfactory} = require("miko-db")


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
    router.get("/", [...globalHooks.all, ...globalHooks.get, ...hooks.all, ...hooks.get, async (req, res, next) => {
      //res.json({ table, method: req.method, url: req.originalUrl, params: req.params, query: req.query })
      let data = null
      let limit = req.get('sql-limit')||req.get('db-limit')
      if (limit && !isNaN(limit)) {
        data = await dbtbl.find(Object.assign(req.query, req.params), parseInt(limit))
      } else {
        data = await dbtbl.find(Object.assign(req.query, req.params))
      }
      if (data && data.length) {
        for(let hook of dataHooks) {
          hook(data)
        }  
      }
      res.json(data)
    }])

    // get one
    router.get( `/:${table.pkey}(\\d+)`, [...globalHooks.all, ...globalHooks.get, ...hooks.all, ...hooks.get, async (req, res, next) => {
      //res.json({ table, method: req.method, url: req.originalUrl, params: req.params, query: req.query })
      let data = await dbtbl.get(req.params)
      if (data) {
        for(let hook of dataHooks) {
          hook(data)
        }
        res.json(data)
      } else {
        res.status(404).json({ table, method: req.method, url: req.originalUrl, params: req.params, query: req.query })
      }
    }])

    // add
    router.post("/", [...globalHooks.all, ...globalHooks.post, ...hooks.all, ...hooks.post, async (req, res, next) => {
      //res.json({ table, method: req.method, url: req.originalUrl, params: req.params, body: req.body })
      let data = await dbtbl.add(Object.assign(req.params, req.body))
      if (data && (data.affectedRows || data.insertId))
        res.status(200).json(data)
      else 
        res.status(409).json({ table, method: req.method, url: req.originalUrl, params: req.params, body: req.body })
    }])

    // delete one
    router.delete( `/:${table.pkey}(\\d+)`, [...globalHooks.all, ...globalHooks.delete, ...hooks.all, ...hooks.delete, async (req, res, next) => {
      //res.json({ table, method: req.method, url: req.originalUrl, params: req.params })
      let data = await dbtbl.remove(req.params)
      if (data && data.affectedRows)
        res.status(200).json({ table, method: req.method, url: req.originalUrl, params: req.params })
      else 
        res.status(404).json({ table, method: req.method, url: req.originalUrl, params: req.params })
    }])
  
    // update/modify one
    router.patch( `/:${table.pkey}(\\d+)`, [...globalHooks.all, ...globalHooks.patch, ...hooks.all, ...hooks.patch, async (req, res, next) => {
      //res.json({ table, method: req.method, url: req.originalUrl, params: req.params, body: req.body })
      let data = await dbtbl.save(Object.assign(req.params, req.body))
      if (data && (data.affectedRows))
        res.status(200).json(data)
      else if (data && 'affectedRows' in data)
        res.status(204).json({ table, method: req.method, url: req.originalUrl, params: req.params, body: req.body })
      else 
        res.status(409).json({ table, method: req.method, url: req.originalUrl, params: req.params, body: req.body })
    }])


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
      router.use(`/${table.name}`, routers[table.name])
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


  function addTable({name, pkey, fkeys}) {
    if (!name) throw new TypeError("A name is required for all tables")
    if (!pkey) throw new TypeError(`A pkey (primmary key) is required for table ${name}`)
    if (!fkeys) fkeys = []
    tableList.push({name, pkey, fkeys})
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

