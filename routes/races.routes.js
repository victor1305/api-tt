const express = require("express")
const router = express.Router()
const RaceController = require('../controllers/RaceController')
const verifyToken = require('../middlewares/validate-token')

router.post('/crear-caballo', RaceController.createHorse)
router.post('/crear-dia-carreras', RaceController.createRacesByDate)
router.get('/cargar-cuadrantes-por-dia/:date', RaceController.getRacesByDate)

module.exports = router