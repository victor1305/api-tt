const express = require("express")
const router = express.Router()
const BetController = require('../controllers/BetController')
const verifyToken = require('../middlewares/validate-token')

router.post('/crear-apuesta', verifyToken, BetController.saveBet) // PROTEGER
router.post('/crear-parametro', verifyToken, BetController.saveParameter) // PROTEGER
router.get('/', BetController.readHomeBets)
router.get('/lista-apuestas/total', BetController.numberBets)
router.get('/lista-apuestas/', BetController.betsList)
router.get('/lista-apuestas-mes/', BetController.getBetByMonth)
router.get('/lista-hipodromos', BetController.getRacecourses)
router.get('/lista-stakes', BetController.getStakes)
router.get('/lista-codigos', BetController.getBetCodes)
router.get('/stats/:year', BetController.statsByYear)
router.get('/detalle-apuesta/:id', BetController.betDetails)
router.get('/balance-diario', BetController.getDayBalance)
router.get('/balance-dia-anterior', BetController.getYesterdayBalance)
router.get('/balance-semana', BetController.getWeekBalance)
router.get('/balance-rango/:start/:end', BetController.getRangeBalance)
router.put('/detalle-apuesta/:id/edit-status', verifyToken, BetController.editBetStatus) // PROTEGER
router.put('/detalle-apuesta/:id/edit', verifyToken, BetController.editBet) // PROTEGER
router.delete('/detalle-apuesta/:id/delete', verifyToken, BetController.deleteBet) // PROTEGER


module.exports = router