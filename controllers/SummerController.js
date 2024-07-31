const jwt = require("jsonwebtoken");
const ms = require("ms");

const SummerDays = require("../models/SummerDays");
const SummerUsers = require("../models/SummerUsers");
const SummerEvents = require("../models/SummerEvents");

exports.login = async (req, res) => {
  console.log('ENMTRAAAAAAA')
  const user = await SummerUsers.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).json({ error: "Usuario o contraseña erroneo" });

  const validatePassword = req.body.password === user.password;
  if (!validatePassword)
    return res.status(400).json({ error: "Usuario o contraseña erroneo" });

  // JWT
  const token = jwt.sign(
    {
      name: user.name,
      id: user._id,
      email: user.email,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES_IN }
  );

  const expiresInMs = ms(process.env.TOKEN_EXPIRES_IN);
  const expDate = Date.now() + expiresInMs;

  res.header("auth-token", token).json({ token, exp: expDate });
};

exports.getEvents = async (req, res) => {
  console.log('ENMTRAAAAAAA')
  const today = new Date();
  const currentMonth = today.getMonth();
  let day = 0;
  if (currentMonth > 6) {
    day = today.getDate();
  }

  try {
    const summerDays = await SummerDays.find({
      day: { $gte: day },
    })
      .populate({
        path: "events",
        populate: {
          path: "createdBy",
          model: "SummerUsers",
        },
      })
      .sort({ day: 1 });
    res.status(200).json(summerDays);
  } catch (error) {
    return res.status(500).json({ error: "Error al buscar eventos" });
  }
};

exports.createEvent = async (req, res) => {
  const event = req.body;
  console.log('ENMTRAAAAAAA')
  try {
    const eventData = new SummerEvents(event);
    await eventData.save()
    const userData = await SummerUsers.findById(event.createdBy);
    userData.eventsCreated = userData.eventsCreated.concat(eventData._id);
    await userData.save()
    const dayData = await SummerDays.findById(event.day);
    dayData.events = dayData.events.concat(eventData._id);
    await dayData.save()
    res.status(200).json(eventData);
  } catch (error) {
    return res.status(500).json({ error: "Error al crear evento" });
  }
};

exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const updatedEventData = req.body;
  console.log('ENMTRAAAAAAA')

  try {
    const updatedEvent = await SummerEvents.findByIdAndUpdate(
      eventId,
      updatedEventData,
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedEvent);
  } catch (error) {
    return res.status(500).json({ error: "Error al actualizar evento" });
  }
};

exports.removeEvent = async (req, res) => {
  const userId = req.params.userId;
  const dayId = req.params.dayId;
  const eventId = req.params.eventId;
  console.log('ENMTRAAAAAAA')

  try {
    await SummerEvents.findByIdAndDelete(eventId);
    const userData = await SummerUsers.findById(userId);
    if (userData) {
      userData.eventsCreated = userData.eventsCreated.filter(
        (event) => !event.equals(eventId)
      );
      await userData.save();
    }
    const dayData = await SummerDays.findById(dayId);
    if (dayData) {
      dayData.events = dayData.events.filter((event) => !event.equals(eventId));
      await dayData.save();
    }
    res.status(200).json({ message: "Evento eliminado exitosamente." });
  } catch (error) {
    return res.status(500).json({ error: "Error al eliminar evento" });
  }
};
