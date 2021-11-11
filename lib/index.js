const RestApp = require("./app")
const RestMySql = require("./mysql")
const RestBeforeHooks = require("./beforehooks")
const RestAfterHooks = require("./afterhooks")

module.exports = RestApp 

module.exports.RestApp = RestApp 
module.exports.RestMySql = RestMySql 
module.exports.RestBeforeHooks = RestBeforeHooks
module.exports.RestAfterHooks = RestAfterHooks