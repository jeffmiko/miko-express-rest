const RestHookMethods = require("./hookmethods")


class RestHooks {

  #hookMethods = { }

  constructor() {
  
  }

  hooks() {
    let name = "_global_hooks"
    if (arguments.length > 1) throw new TypeError("Only one hook name is allowed.")
    if (arguments.length ==1) name = arguments[0]
    if (!this.#hookMethods[name]) 
      this.#hookMethods[name] = new RestHookMethods()
    return this.#hookMethods[name]
  }

}

module.exports = RestHooks