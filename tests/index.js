require("dotenv").config()
const pools = require("./dbpools")
const { dbrest } = require("../lib")
const express = require("express")
const cors = require("cors")
const http = require("http")


const app = express()


// allow CORS
app.use(cors()) // allow all origins
app.options('*', cors()) // allow pre-flights

// body parsers
app.use(express.json())


// TODO: add api here
const pool = pools.getMariaDB()
const api = dbrest(pool)
api.addTable({name: 'users', pkey: 'userpk', fkeys: []})


let apiRoutes = api.createRoutes()
app.use("/api", apiRoutes)



// everything else return 404
app.use((req, res) => {
  res.status(404).json({ 
    method: req.method, 
    url: req.originalUrl,                          
    params: req.params,
    query: req.query,
    body: req.body, 
  })
})

let port = process.env.HTTP_PORT || 3000
let httpServer = http.createServer(app);
httpServer.listen(port);
console.log(`Listening on port ${port} as of`, new Date().toLocaleTimeString())
