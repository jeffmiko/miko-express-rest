const mysql = require("mysql2")
const express = require("./express")
const dbconfig = Object.assign({  
  charset: "utf8",
}, require("./dbconfig"))  
const api = require("./api")
const runtests = require("./runtests")




module.exports.testRest = async function testRest() {
  console.log("Starting MySQL2 tests")
  const pool = mysql.createPool(dbconfig);
  const httpServer = express(api, pool, "/api")
  
  await runtests()


  console.log("Stopping MySQL2 tests")
  if (httpServer.listening) httpServer.close()
  await pool.end() 

}

