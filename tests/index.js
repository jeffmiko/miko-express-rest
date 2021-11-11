require("dotenv").config()
const testMysql = require("./mysql")
const testMysql2 = require("./mysql2")
const testMariadb = require("./mariadb")



async function test() {
  console.log("")
  await testMysql()
  console.log("")
  await testMysql2()
  console.log("")
  await testMariadb()
  console.log("")
}



test()
