const RestApp = require("./app")
const RestMySqlRequest = require("./mysqlrequest")
const RestBeforeHooks = require("./beforehooks")
const RestAfterHooks = require("./afterhooks")

module.exports = RestApp 

module.exports.RestApp = RestApp 
module.exports.RestMySqlRequest = RestMySqlRequest 
module.exports.RestBeforeHooks = RestBeforeHooks
module.exports.RestAfterHooks = RestAfterHooks