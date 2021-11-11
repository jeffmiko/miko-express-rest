const RestHooks = require("./hooks")


class RestService extends RestHooks {


  constructor(service, name, path) {
    super()
    if (!service) throw new TypeError("A service object is required")
    if (!name) throw new TypeError("A service name is required")
    if (typeof service !== "object") throw new TypeError("The service must be an object type")
    this.service = service
    this.name = name 
    if (path) {
      this.path = path
    } else {
      this.path = name
    }
    if (this.path.startsWith('/'))
      this.path = this.path.substr(1)

    let methods = new Set()
    let currentObj = service
    do {
      if (currentObj.constructor.name == "Object") break
      Object.getOwnPropertyNames(currentObj).map(name => {
        if (name != "constructor" && typeof currentObj[name] === "function" ) {
          methods.add(name)
        }
      })
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    if (methods.size == 0) throw new TypeError("No service methods found.")

  }

  get methods() {
    let methods = []
    let currentObj = this.service
    do {
      if (currentObj.constructor.name == "Object") break
      Object.getOwnPropertyNames(currentObj).map(name => {
        if (name != "constructor" && typeof currentObj[name] === "function" ) {
          methods.push(name)
        }
      })
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return methods
  }

  // get function handler
  handler(name) {
    return this.service[name]
  }

}


module.exports = RestService
