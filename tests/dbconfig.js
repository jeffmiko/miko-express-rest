
// Either set ENV vars for database connection options
// or set them here

module.exports =  {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "your user name", 
  password: process.env.DB_PWD || "your password",
  database: process.env.DB_NAME || "your database name",
  connectionLimit: process.env.DB_POOL_SIZE || 5,
}