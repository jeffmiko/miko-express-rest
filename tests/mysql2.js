const mysql = require("mysql2")
const express = require("./express")
const dbconfig = require("./dbconfig")
const api = require("./api")
const runtests = require("./runtests")




async function testMysql() {
  console.log("Starting MySQL2 tests")
  const config = Object.assign({  
    charset: "utf8",
  }, dbconfig)  
  const pool = mysql.createPool(config);
  const httpServer = express(api, pool, "/api")
  
  await runtests()


  console.log("Stopping MySQL2 tests")
  if (httpServer.listening) httpServer.close()
  await pool.end() 

}

module.exports = testMysql