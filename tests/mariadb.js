const mariadb = require("mariadb")
const express = require("./express")
const dbconfig = require("./dbconfig")
const api = require("./api")
const runtests = require("./runtests")


async function testMariadb() {

  console.log("Starting MariaDB tests")
  const config = Object.assign({  
      allowPublicKeyRetrieval: true ,
      collation: "utf8mb4_unicode_ci",
    }, dbconfig)
  const pool = mariadb.createPool(config);
  const httpServer = express(api, pool, "/api")
  
  await runtests()

  console.log("Stopping MariaDB tests")
  if (httpServer.listening) httpServer.close()
  await pool.end() 

}



module.exports = testMariadb