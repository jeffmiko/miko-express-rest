require("dotenv").config()
const mysql = require("./mysql")
const mysql2 = require("./mysql2")
const mariadb = require("./mariadb")


async function test() {
  console.log("")
  await mysql.testRest()
  console.log("")
  await mysql2.testRest()
  console.log("")
  await mariadb.testRest()
  console.log("")
}



test()

