const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
require('dotenv').config()

const app = express();

// capturar body
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

// Conexión a Base de datos
const uri = `mongodb+srv://${process.env.CLUSTERUSER}:${process.env.PASSWORD}@cluster0.9xqd9.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`
const option = { useNewUrlParser: true, useUnifiedTopology: true }
mongoose.connect(uri, option)
.then(() => console.log('Base de datos conectada'))
.catch(e => console.log('error db:', e))

// cors
const cors = require('cors');
const whitelist = [
    "http://localhost:3000",
    "https://turftipster.es",
    "https://cms-tt-front.herokuapp.com"
]
const corsOptions = {
    origin: (origin, cb) => {
        const originIsWhitelisted = whitelist.includes(origin)
        cb(null, originIsWhitelisted)
        
    },
    credentials: true
}
app.use(cors(corsOptions));

// import routes
const authRoutes = require('./routes/user.routes')
const betsRoutes = require('./routes/bets.routes')
const clientsRoutes = require('./routes/client.routes')

// route middlewares
app.use('/api', authRoutes)
app.use('/api/apuestas', betsRoutes)
app.use('/api/clientes', clientsRoutes)

// iniciar server
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`servidor corriendo en el puerto: ${PORT}`)
})