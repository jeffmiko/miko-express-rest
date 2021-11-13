const mysql = require("mysql")
const express = require("./express")
const dbconfig =  Object.assign({  
  charset: "utf8",
}, require("./dbconfig"))
const api = require("./api")
const runtests = require("./runtests")


module.exports.testRest = async function testRest() {
  console.log("Starting MySQL tests")
  const pool = mysql.createPool(dbconfig);
  const httpServer = express(api, pool, "/api")
  
  await runtests()


  console.log("Stopping MySQL tests")
  if (httpServer.listening) httpServer.close()
  await pool.end() 

}

module.exports.testDB = async function testDB() {
  let name = "mysql"
  let conn = mysql.createConnection(dbconfig)
  conn.query("SELECT database() as dbname", (err, rows) => {
    console.log(name,"DBNAME", rows[0].dbname)

    console.log("")
    conn.end()
  });

}
