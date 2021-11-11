const RestService = require("./service")
const RestMySqlPromisePool = require("./mysqlpool")


class RestApp {

  #services = {}

  constructor() {
  }

  // add a new service
  use(service, name, path) {
    if (!service) throw new TypeError("A service object is required")
    if (typeof service !== "object") throw new TypeError("The service must be an object type")

    // check for array of named services
    if (Array.isArray(service)) {
      for(let svc of service) {
        if (!svc.name) throw new TypeError("All services must have a name")
        this.#services[svc.name] =new RestService(svc, svc.name)  
      }
    } else {
      if (!name) name = service.name
      if (!name) throw new TypeError("A service name is required")
      if (name in this.#services) throw new TypeError(`the service ${name} already exists`)
      this.#services[name] = new RestService(service, name, path)  
    }
    return this
  }

  // return specific service by name
  service(name) {
    let svc =  this.#services[name]
    if (!svc) throw new TypeError(`The service ${name} could not be found.`)
    return svc
  }  


  #getPoolHandler(nativePool) {
    if (nativePool) {
      let pool = nativePool
      if (!/promise/i.test(nativePool.constructor.name))
        pool = new RestMySqlPromisePool(nativePool)
        
      // add handler to add req.db object to all requests
      return (req, res, next) => {
        let name = req.get("dbname") || req.get("dbschema")
        if (name) req.db = { pool, name } 
        else req.db = { pool }
        next()
      }
    } else {
      // add handler to add req.db object to all requests
      return (req, res, next) => {
        let name = req.get("dbname") || req.get("dbschema")
        if (name) req.db = { name } 
        else req.db = { }
        next()
      }
    }
  }


  #getDataHandler() {
    return (req, res, next) => {
      if (req.db) {
        if (req.db.data) {
          res.json(req.db.data)
        } else {
          res.json([])
        }
      } else {
        next()
      }
    }
  }


  // attach to an Express app object 
  // adds all services/paths
  attach({app, pool, root}) {
    let dbHandler = this.#getPoolHandler(pool)
    let dataHandler = this.#getDataHandler()

    
    if (!root) root = "/"
    else if (!root.endsWith('/')) root += "/"

    // add handlers for all services 
    for(let svc of Object.values(this.#services)) {
      let svcroot = root+svc.path
      
      svc.methods.forEach(method => {
        let path = svcroot+"/"+method
        let fn = svc.handler(method)
        // make sure function exists and takes 3 arguments
        if (fn) {
          if (fn.length==3) {
            fn = fn.bind(svc.service)
            //console.log("adding", path)
            let handlers = [dbHandler]
            let hooks = null
            // add global service before hooks
            hooks = svc.hooks().before()
            if (hooks) handlers.push(...hooks)
            // add service method before hooks
            hooks = svc.hooks(method).before()
            if (hooks) handlers.push(...hooks)
            // add main method handler
            handlers.push(fn)
            // add service method after hooks
            hooks = svc.hooks(method).after()
            if (hooks) handlers.push(...hooks)
            // add global after hooks
            hooks = svc.hooks().after()
            if (hooks) handlers.push(...hooks)

            // add handler to send the data 
            handlers.push(dataHandler)
            
            app.all(path, ...handlers)

          } else {
            console.warn(`Skipping ${path} as it only has ${fn.length} arguments`)
          }
        }
      })
      
    }

  


  }

}

module.exports = RestApp
