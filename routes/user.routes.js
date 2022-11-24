const router = require('express').Router()
const UserController = require('../controllers/UserController')

//router.post('/registro', UserController.registro)  // Anulo la posibilidad de crear nuevos usuarios
router.post('/iniciar-sesion-turftipster', UserController.login)

module.exports = router