const router = require("express").Router();
const SummerController = require("../controllers/SummerController");

router.get("/cargar-eventos", SummerController.getEvents);
router.post("/iniciar-sesion", SummerController.login);
router.post("/crear-evento", SummerController.createEvent);
router.put("/actualizar-evento/:eventId", SummerController.updateEvent);
router.delete(
  "/borrar-evento/:userId/:dayId/:eventId",
  SummerController.removeEvent
);

module.exports = router;
