const dbrest = require("./dbrest")
const dbhook = {
  request: require("./hooks"),
  data: require("./hooks-data"),  
}


module.exports = {
  dbrest, 
  dbhook,
}
