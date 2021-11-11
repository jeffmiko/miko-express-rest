const mysql = require("mysql")
const express = require("./express")
const dbconfig = require("./dbconfig")
const api = require("./api")
const runtests = require("./runtests")




async function testMysql() {
  console.log("Starting MySQL tests")
  const config = Object.assign({  
    charset: "utf8",
  }, dbconfig)  
  const pool = mysql.createPool(config);
  const httpServer = express(api, pool, "/api")
  
  await runtests()


  console.log("Stopping MySQL tests")
  if (httpServer.listening) httpServer.close()
  await pool.end() 

}

module.exports = testMysql