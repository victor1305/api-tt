const HorseRace = require("../models/HorseRace.model");
const Horse = require("../models/Horse.model");

exports.createHorse = async (req, res, next) => {
  const horseData = new Horse({
    name: req.body.name,
    year: req.body.year,
    table: req.body.table,
  });

  const horseValues = req.body.values;

  try {
    const saveHorseData = await horseData.save();

    if (horseValues.length > 0) {
      const valuesIds = [];
      for (let i = 0; i < horseValues.length; i++) {
        const horseRaceData = new HorseRace({
          horse: saveHorseData._id,
          value: horseValues[i].value,
          surface: horseValues[i].surface,
          mud: horseValues[i].mud,
          date: horseValues[i].date,
        });
        const saveHorseRaceData = await horseRaceData.save();
        valuesIds.push(saveHorseRaceData._id);
      }

      saveHorseData.values = saveHorseData.values.concat(valuesIds);
      await saveHorseData.save();
    }
    res.json({
      data: saveHorseData,
    });
  } catch (error) {
    res.status(400).json(error);
  }
};
