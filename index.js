const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
require('dotenv').config()

const app = express();

// capturar body
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

// Conexión a Base de datos
const uri = `mongodb+srv://${process.env.CLUSTERUSER}:${process.env.PASSWORD}@cluster0.9xqd9.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority&ssl=true&replicaSet=atlas-8-shard-0&authSource=admin&retryReads=true`
const option = { useNewUrlParser: true, useUnifiedTopology: true }
mongoose.connect(uri, option)
.then(() => console.log('Base de datos conectada'))
.catch(e => console.log('error db:', e))

// cors
const cors = require('cors');
const whitelist = [
    "http://localhost:3000",
    "https://turftipster.es",
    'https://www.turftipster.es',
    "https://cms-tt-front.herokuapp.com",
    "https://cms-tt-static.onrender.com",
    "https://tt-cms-next.vercel.app",
    "https://summer2024-victor1305s-projects.vercel.app/",
    "https://summer2024-three.vercel.app",
    "https://cms-tt.onrender.com",
    "http://127.0.0.1:4040/"
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
const racesRoutes = require('./routes/races.routes')
const summerRoutes = require('./routes/summer.routes')

// route middlewares
app.use('/api', authRoutes)
app.use('/api/apuestas', betsRoutes)
app.use('/api/clientes', clientsRoutes)
app.use('/api/races', racesRoutes)
app.use('/api/summer', summerRoutes)

// iniciar server
const PORT = process.env.PORT || 3030;

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
})

app.listen(PORT, () => {
    console.log(`servidor corriendo en el puerto: ${PORT}`)
})