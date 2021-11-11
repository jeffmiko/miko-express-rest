const RestApp = require("./app")
const RestMySqlRequest = require("./mysqlrequest")
const RestMySqlTable = require("./mysqltable")
const RestBeforeHooks = require("./beforehooks")
const RestAfterHooks = require("./afterhooks")
const RestMySqlPromisePool = require("./mysqlpool")

module.exports = RestApp 

module.exports.RestApp = RestApp 
module.exports.RestMySqlRequest = RestMySqlRequest 
module.exports.RestMySqlTable = RestMySqlTable
module.exports.RestBeforeHooks = RestBeforeHooks
module.exports.RestAfterHooks = RestAfterHooks
module.exports.RestMySqlPromisePool = RestMySqlPromisePool
