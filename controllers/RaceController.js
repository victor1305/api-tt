const HorseRace = require("../models/HorseRace.model");
const Horse = require("../models/Horse.model");
const Race = require("../models/Race.model");

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

exports.getRacesNumberByMonth = async (req, res) => {
  const { year, month } = req.params;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  try {
    const result = await Race.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$date" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const raceCountByDay = {};
    result.forEach((item) => {
      raceCountByDay[item._id] = item.count;
    });

    res.json(raceCountByDay);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getRacesByDate = async (req, res) => {
  const date = req.params.date;
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  try {
    const result = await Race.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $lookup: {
          from: "horses",
          localField: "horses",
          foreignField: "_id",
          as: "horses",
        },
      },
      { $unwind: "$horses" },
      {
        $lookup: {
          from: "horseraces",
          localField: "horses.values",
          foreignField: "_id",
          as: "horses.values",
        },
      },
      {
        $set: {
          "horses.thisRaceData": {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$horses.values",
                  as: "value",
                  cond: { $eq: ["$$value.date", "$date"] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $set: {
          "horses.values": {
            $filter: {
              input: "$horses.values",
              as: "value",
              cond: { $ne: ["$$value.date", "$date"] },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          horses: { $push: "$horses" },
        },
      },
      {
        $set: {
          "root.horses": "$horses",
        },
      },
      {
        $replaceRoot: { newRoot: "$root" },
      },
      {
        $group: {
          _id: "$racecourseCode",
          races: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          racecourseCode: "$_id",
          races: 1,
        },
      },
    ]);

    const formattedResult = result.reduce((acc, current) => {
      acc[current.racecourseCode] = current.races;
      return acc;
    }, {});

    res.json(formattedResult);
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.checkExistingRace = async (racecourseCode, number, date) => {
  try {
    const existingRace = await Race.findOne({
      racecourseCode: racecourseCode,
      number: number,
      date: date,
    });
    return existingRace;
  } catch (error) {
    throw error;
  }
};

exports.actualizar = async (req, res) => {
  const date = req.body.date;

  const races = await fetch(
    `https://online.turfinfo.api.pmu.fr/rest/client/62/programme/${date}?meteo=true&specialisation=OFFLINE`
  );
  const racesParsed = await races.json();
  if (!racesParsed.programme) {
    return res
      .status(400)
      .json({ error: "Aun no puedes generar este cuadrante" });
  }
  const reunions = racesParsed?.programme?.reunions;
  const listReunions = [];

  for (let i = 0; i < reunions.length; i++) {
    if (
      reunions[i].pays.code === "FRA" &&
      reunions[i].audience === "NATIONAL" &&
      reunions[i].disciplinesMere.includes("PLAT")
    ) {
      for (let j = 0; j < reunions[i].courses.length; j++) {
        if (reunions[i].courses[j].discipline === "PLAT") {
          listReunions.push(
            `R${reunions[i].numOfficiel}/C${reunions[i].courses[j].numOrdre}`
          );
        }
      }
    }
  }
  try {
    for (let i = 0; i < listReunions.length; i++) {
      const raceUrl = `https://online.turfinfo.api.pmu.fr/rest/client/62/programme/${date}/${listReunions[i]}/participants?specialisation=OFFLINE`;
      const raceResponse = await fetch(raceUrl);
      const raceResponseParsed = await raceResponse.json();
      const participants = raceResponseParsed.participants;

      const day = parseInt(date.substring(0, 2));
      const month = parseInt(date.substring(2, 4)) - 1;
      const year = parseInt(date.substring(4, 8));
      const startDate = new Date(year, month, day);
      const endDate = new Date(year, month, day + 1);

      for (let j = 0; j < participants.length; j++) {
        if (participants[j].race === "PUR-SANG" && participants[j].supplement > 0) {
          const horse = await Horse.findOne({
            name: participants[j].nom.toUpperCase(),
            year: new Date().getFullYear() - participants[j].age,
            table: "FRA",
          });
          if (horse) {
            const horseRace = await HorseRace.findOne({
              horse: horse._id,
              date: {
                $gte: startDate,
                $lt: endDate,
              },
            });
            //horseRace.debut = true
            horseRace.supplement = true
            // horseRace.weight = participants[j].handicapPoids / 10;
            // horseRace.unload =
            //   (participants[j].poidsConditionMonte &&
            //     participants[j].poidsConditionMonte / 10) ||
            //   0;
            await horseRace.save();
          } else {
            console.log(
              `***************************NO ENCUENTRA A ${participants[
                j
              ].nom.toUpperCase()}`
            );
          }
        }
      }
    }
    res.json({
      msg: "PESOS AÑADIDOS",
    });
  } catch (error) {
    return res.status(400).json({ error: "Ha habido un error actualizando" });
  }
};

exports.createRacesByDate = async (req, res) => {
  const date = req.body.date;

  const races = await fetch(
    `https://online.turfinfo.api.pmu.fr/rest/client/62/programme/${date}?meteo=true&specialisation=OFFLINE`
  );
  const racesParsed = await races.json();
  if (!racesParsed.programme) {
    return res
      .status(400)
      .json({ error: "Aun no puedes generar este cuadrante" });
  }
  const reunions = racesParsed?.programme?.reunions;
  const listReunions = [];

  for (let i = 0; i < reunions.length; i++) {
    if (
      reunions[i].pays.code === "FRA" &&
      reunions[i].audience === "NATIONAL" &&
      reunions[i].disciplinesMere.includes("PLAT")
    ) {
      for (let j = 0; j < reunions[i].courses.length; j++) {
        if (reunions[i].courses[j].discipline === "PLAT") {
          listReunions.push(
            `R${reunions[i].numOfficiel}/C${reunions[i].courses[j].numOrdre}`
          );
        }
      }
    }
  }

  if (listReunions.length > 0) {
    try {
      for (let i = 0; i < listReunions.length; i++) {
        const raceUrl = `https://online.turfinfo.api.pmu.fr/rest/client/62/programme/${date}/${listReunions[i]}/participants?specialisation=OFFLINE`;
        const raceResponse = await fetch(raceUrl);
        const raceResponseParsed = await raceResponse.json();
        const participants = raceResponseParsed.participants;
        const reunionInfo = reunions.find(
          (obj) => obj.numOfficiel === parseInt(listReunions[i].charAt(1))
        );
        const raceInfo = reunionInfo.courses.find(
          (obj) =>
            obj.numOrdre ===
            parseInt(
              listReunions[i].length === 5
                ? listReunions[i].slice(-1)
                : listReunions[i].slice(-2)
            )
        );
        let racingTrack = "Hierba";
        const time = new Date(raceInfo.heureDepart);
        const hour = time.getHours();
        const minutes = time.getMinutes();
        const timeFormated = `${hour < 10 ? `0${hour}` : hour}:${
          minutes < 10 ? `0${minutes}` : minutes
        }`;

        if (raceInfo.parcours.includes("FIBRE")) racingTrack = "PSF";
        const day = parseInt(date.substring(0, 2));
        const month = parseInt(date.substring(2, 4)) - 1;
        const year = parseInt(date.substring(4, 8));

        const isoDate = new Date(year, month, day, hour, minutes).toISOString();
        const partantsFormatted = [];
        const existingRace = await exports.checkExistingRace(
          raceInfo.hippodrome.codeHippodrome,
          raceInfo.numOrdre,
          isoDate
        );
        if (!existingRace) {
          const raceData = new Race({
            racecourseCode: raceInfo.hippodrome.codeHippodrome,
            racecourse: raceInfo.hippodrome.libelleCourt,
            number: raceInfo.numOrdre,
            date: isoDate,
            raceType: raceInfo.categorieParticularite,
            surface: racingTrack,
            distance: raceInfo.distance,
            time: timeFormated,
            corde: raceInfo.corde
          });

          for (let j = 0; j < participants.length; j++) {
            if (participants[j].race === "PUR-SANG") {
              const horseData = await Horse.findOne({
                name: participants[j].nom.toUpperCase(),
                year: new Date().getFullYear() - participants[j].age,
                table: "FRA",
              });

              if (horseData) {
                const horseRaceData = new HorseRace({
                  number: participants[j].numPmu,
                  horse: horseData._id,
                  complements:
                    participants[j].oeilleres === "OEILLERES_AUSTRALIENNES"
                      ? "CA"
                      : participants[j].oeilleres === "OEILLERES_CLASSIQUE"
                      ? "BR"
                      : "",
                  box: participants[j].placeCorde,
                  jockey: participants[j].driver,
                  unload:
                    (participants[j].poidsConditionMonte &&
                      participants[j].poidsConditionMonte / 10) ||
                    0,
                  weight: participants[j].handicapPoids / 10,
                  trainer: participants[j].entraineur,
                  racecourseCode: raceInfo.hippodrome.codeHippodrome,
                  racecourse: raceInfo.hippodrome.libelleCourt,
                  corde: raceInfo.corde,
                  race: raceInfo.numOrdre,
                  distance: raceInfo.distance,
                  raceType: raceInfo.categorieParticularite,
                  surface: racingTrack,
                  date: isoDate,
                  ...(participants[j].supplement > 0 && { supplement: true }),
                  ...(participants[j].indicateurInedit && { debut: true }),
                });

                const horseRaceDataSaved = await horseRaceData.save();
                horseData.values = horseData.values.concat(
                  horseRaceDataSaved._id
                );
                horseData.races = horseData.races.concat(raceData._id);
                await horseData.save();
                partantsFormatted.push(horseData._id);
              } else {
                const newHorse = new Horse({
                  name: participants[j].nom.toUpperCase(),
                  year: new Date().getFullYear() - participants[j].age,
                  table: "FRA",
                });

                const newHorseSaved = await newHorse.save();
                const horseRaceData = new HorseRace({
                  number: participants[j].numPmu,
                  horse: newHorseSaved._id,
                  complements:
                    participants[j].oeilleres === "OEILLERES_AUSTRALIENNES"
                      ? "CA"
                      : participants[j].oeilleres === "OEILLERES_CLASSIQUE"
                      ? "BR"
                      : "",
                  box: participants[j].placeCorde,
                  jockey: participants[j].driver,
                  unload:
                    (participants[j].poidsConditionMonte &&
                      participants[j].poidsConditionMonte / 10) ||
                    0,
                  weight: participants[j].handicapPoids / 10,
                  trainer: participants[j].entraineur,
                  racecourseCode: raceInfo.hippodrome.codeHippodrome,
                  racecourse: raceInfo.hippodrome.libelleCourt,
                  corde: raceInfo.corde,
                  race: raceInfo.numOrdre,
                  distance: raceInfo.distance,
                  raceType: raceInfo.categorieParticularite,
                  surface: racingTrack,
                  date: isoDate,
                  ...(participants[j].supplement > 0 && { supplement: true }),
                  ...(participants[j].indicateurInedit && { debut: true }),
                });
                const horseRaceDataSaved = await horseRaceData.save();
                newHorseSaved.values = newHorseSaved.values.concat(
                  horseRaceDataSaved._id
                );
                newHorseSaved.races = newHorseSaved.races.concat(raceData._id);
                await newHorseSaved.save();
                partantsFormatted.push(newHorseSaved._id);
              }
            }
          }
          if (partantsFormatted.length) {
            raceData.horses = partantsFormatted;
            await raceData.save();
          }
        }
      }
      res.json({
        msg: "Jornada creada correctamente",
      });
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Ha habido un error creando el día" });
    }
  } else {
    return res
      .status(400)
      .json({ error: "No hay carreras de tablas en esta fecha" });
  }
};
