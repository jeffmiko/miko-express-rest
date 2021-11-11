
class RestHookMethods {

  #hookTypes = {
    before: [],
    after: [],
  }

  before() {
    if (arguments.length == 0) 
      return this.#hookTypes.before
    for(let arg of arguments) {
      if (typeof arg !== "function") 
        throw new TypeError("Hooks must be functions")
      this.#hookTypes.before.push(arg)
    }
    return this
  }

  after() {
    if (arguments.length == 0) 
      return this.#hookTypes.after
    for(let arg of arguments) {
      if (typeof arg !== "function") 
        throw new TypeError("Hooks must be functions")
      this.#hookTypes.after.push(arg)
    }
    return this
  }

}

module.exports = RestHookMethods
