const express = require("express")
const cors = require("cors")
const http = require("http")


module.exports = function createExpress(api, pool, root='/api') {

  const app = express()

  
  // allow CORS
  app.use(cors()) // allow all origins
  app.options('*', cors()) // allow pre-flights
  
  // body parsers
  app.use(express.json())
  
  // attach API 
  api.attach({app, pool, root})
  
  let httpServer = http.createServer(app);
  httpServer.listen(process.env.HTTP_PORT || 3000);

  return httpServer
}

