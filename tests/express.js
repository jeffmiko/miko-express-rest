const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const cookieParser = require("cookie-parser")
const http = require("http")


module.exports = function createExpress(api, pool, root='/api') {

  const app = express()

  // dont mention Express in headers
  app.disable("x-powered-by") 
  
  // Disabling frameguard so LTI apps can live in iframes
  app.use(helmet({
    frameguard: false, 
    contentSecurityPolicy: false
  }))
  
  // allow CORS
  app.use(cors()) // allow all origins
  app.options('*', cors()) // allow pre-flights
  
  // body parsers
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())
  app.use(express.raw())
  app.use(express.text())
  app.use(cookieParser("abc411f67cd2a4e153955a77307ec7e2"))
  
  // attach API 
  api.attach({app, pool, root})
  
  let httpServer = http.createServer(app);
  httpServer.listen(process.env.HTTP_PORT || 3000);

  return httpServer
}

