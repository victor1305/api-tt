const express = require("express")
const router = express.Router()
const RaceController = require('../controllers/RaceController')
const verifyToken = require('../middlewares/validate-token')

router.post('/crear-caballo', RaceController.createHorse)

module.exports = router