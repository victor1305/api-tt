const express = require("express")
const router = express.Router()
const BetController = require('../controllers/BetController')
const verifyToken = require('../middlewares/validate-token')

router.post('/crear-apuesta', verifyToken, BetController.saveBet) // PROTEGER
router.post('/crear-apuesta-personal', verifyToken, BetController.savePersonalBet) // PROTEGER
router.post('/crear-parametro', verifyToken, BetController.saveParameter) // PROTEGER
router.get('/', BetController.readHomeBets)
router.get('/lista-apuestas/total', BetController.numberBets)
router.get('/lista-apuestas/', BetController.betsList)
router.get('/lista-apuestas-mes/', BetController.getBetByMonth)
router.get('/lista-apuestas-dia/', BetController.getBetsByDay)
router.get('/lista-apuestas-personales-dia/:id', verifyToken, BetController.getPersonalBetsByDay)
router.get('/lista-apuestas-personales-mes/:id', verifyToken, BetController.getPersonalBetsByMonth)
router.get('/lista-balances-personales-mes/:id', verifyToken, BetController.getPersonalBalancesByMonth)
router.get('/lista-hipodromos', BetController.getRacecourses)
router.get('/lista-stakes', BetController.getStakes)
router.get('/lista-codigos', BetController.getBetCodes)
router.get('/stats/:year', BetController.statsByYear)
router.get('/stats/:year/month', BetController.statsByYearAndMonth)
router.get('/stats/:year/:type', BetController.statsByYearAndType)
router.get('/stats/:year/:month/:type', BetController.statsByYearMonthAndType)
router.get('/detalle-apuesta/:id', BetController.betDetails)
router.get('/all-balances', BetController.getAllBalances)
router.get('/balance-diario', BetController.getDayBalance)
router.get('/balance-dia-anterior', BetController.getYesterdayBalance)
router.get('/balance-semana', BetController.getWeekBalance)
router.get('/balance-rango/:start/:end', BetController.getRangeBalance)
router.put('/detalle-apuesta/:id/edit-status', verifyToken, BetController.editBetStatus) // PROTEGER
router.put('/crear-apuesta-personal/:id/edit', verifyToken, BetController.editPersonalBet) // PROTEGER
router.put('/detalle-apuesta/:id/edit', verifyToken, BetController.editBet) // PROTEGER
router.delete('/detalle-apuesta/:id/delete', verifyToken, BetController.deleteBet) // PROTEGER
router.delete('/crear-apuesta-personal/:id/delete', verifyToken, BetController.deletePersonalBet) // PROTEGER


module.exports = router