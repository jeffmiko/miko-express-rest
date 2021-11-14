const mariadb = require("mariadb")
const mysql = require("mysql")
const mysql2 = require("mysql2")

// Either set ENV vars for database connection options
// or set them here

const dbconfig =  {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "your user name", 
  password: process.env.DB_PWD || "your password",
  database: process.env.DB_NAME || "your database name",
  connectionLimit: process.env.DB_POOL_SIZE || 5,
}


module.exports.getMariaDB = function() {
  return mariadb.createPool(
    Object.assign({ 
      allowPublicKeyRetrieval: true ,
      collation: "utf8mb4_unicode_ci",
    }, dbconfig)
  );
}

module.exports.getMySql = function() {
  return mysql.createPool(
    Object.assign({ 
      charset: "utf8",
    }, dbconfig)
  );
}

module.exports.getMySql2 = function() {
  return mysql2.createPool(
    Object.assign({ 
      charset: "utf8",
    }, dbconfig)
  );
}
