const {RestApp, RestMySql, RestBeforeHooks, RestAfterHooks} = require("../lib");


const rest = new RestApp()
const tables = ["users"]

for(let tbl of tables) {
  rest.use(new RestMySql(tbl))  
  rest.service(tbl).hooks()
    .before(RestBeforeHooks.isoToDate(["created", "updated"]))
    .after(RestAfterHooks.stripNulls())
}


module.exports = rest