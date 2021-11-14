const dbrest = require("./dbrest")
const request = require("./hooks")
const data = require("./hooks-data")

module.exports = {
  dbrest, 
  hooks: { request, data }
}
