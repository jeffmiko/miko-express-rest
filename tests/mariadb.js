const mariadb = require("mariadb")
const express = require("./express")
const api = require("./api")
const dbconfig = Object.assign({  
  allowPublicKeyRetrieval: true ,
  collation: "utf8mb4_unicode_ci",
}, require("./dbconfig"))
const runtests = require("./runtests")


module.exports.testRest = async function testRest() {

  console.log("Starting MariaDB tests")

  const pool = mariadb.createPool(dbconfig);
  const httpServer = express(api, pool, "/api")
  
  await runtests()

  console.log("Stopping MariaDB tests")
  if (httpServer.listening) httpServer.close()
  await pool.end() 

}

module.exports.testDB = async function testDB() {
  let name = "mariadb"
  let mdb = require("mariadb/callback")
  let conn = mdb.createConnection(dbconfig)
  conn.query("SELECT database() as dbname", (err, rows) => {
    console.log(name,"DBNAME", rows[0].dbname)

    console.log("")
    conn.end()
  });

}


