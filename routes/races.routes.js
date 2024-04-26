const express = require("express")
const router = express.Router()
const RaceController = require('../controllers/RaceController')
const verifyToken = require('../middlewares/validate-token')

router.post('/crear-caballo', RaceController.createHorse)
router.post('/envio-viejos', RaceController.createOldPrevValues)
router.post('/envio-restas-drive', RaceController.getDrivesRests)
router.post('/envio-correcciones-drive', RaceController.getDrivesCorrections)
router.post('/crear-dia-carreras', RaceController.createRacesByDate)
router.post('/crear-carrera-caballo/:id', verifyToken, RaceController.createHorseRace)
router.post('/actualizar-resultados-carrera', RaceController.addResultsByDate)
router.post('/actualizar', RaceController.actualizar)
router.put('/editar-valor/:id/edit', verifyToken, RaceController.editValue)
router.put('/editar-dia/:id/edit', verifyToken, RaceController.updateDayControl)
router.get('/cargar-cuadrantes-por-dia/:date', RaceController.getRacesByDate)
router.get('/cargar-carreras-por-mes/:year/:month', RaceController.getRacesNumberByMonth)

module.exports = router