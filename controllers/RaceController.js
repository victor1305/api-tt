const HorseRace = require("../models/HorseRace.model");
const Horse = require("../models/Horse.model");
const Race = require("../models/Race.model");
const nodemailer = require("nodemailer");
const QuadrantDay = require("../models/QuadrantDay.model");
const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
  ShadingType,
} = require("docx");
const fs = require("fs");

exports.getRacesByHorse = async (req, res, next) => {
  const horseData = req.body;

  try {
    const horses = await Horse.find({
      name: horseData.horseName.toUpperCase(),
      ...(horseData.horseAge && {
        year: new Date().getFullYear() - horseData.horseAge,
      }),
    }).populate({
      path: "values",
      options: { sort: { date: -1 } },
    });
    res.json(horses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createOldPrevValues = async (req, res, next) => {
  const horses = req.body;

  try {
    for (let i = 0; i < horses.length; i++) {
      const horseData = await Horse.findOne({
        name: horses[i].name.toUpperCase(),
        year: new Date().getFullYear() - parseInt(horses[i].age),
        table: "FRA",
      });

      if (
        horseData &&
        horseData.values.length === 1 &&
        horses[i].races.length
      ) {
        const valuesIds = [];
        for (let j = 0; j < horses[i].races.length; j++) {
          const horseRaceData = new HorseRace({
            horse: horseData._id,
            value: horses[i].races[j].value,
            surface: horses[i].races[j].surface,
            mud: horses[i].races[j].mud,
            date: horses[i].races[j].date,
          });
          const saveHorseRaceData = await horseRaceData.save();
          valuesIds.push(saveHorseRaceData._id);
        }
        horseData.values = [...valuesIds, ...horseData.values];
        await horseData.save();
      }
    }
    res.json({ message: "Valores previos de caballos creados exitosamente" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.getDrivesCorrections = async (req, res, next) => {
  const horses = req.body;
  try {
    for (let i = 0; i < horses.length; i++) {
      if (horses[i].age) {
        console.log(horses[i].horseName.toUpperCase());
        const horseData = await Horse.findOne({
          name: horses[i].horseName.toUpperCase(),
          year: new Date().getFullYear() - parseInt(horses[i].age),
          table: "FRA",
        });

        if (horseData) {
          const day = horses[i].date.substring(0, 2);
          const month = horses[i].date.substring(2, 4);
          const year = horses[i].date.substring(4, 8);
          const date = new Date(year, month - 1, day);

          const startOfDay = new Date(date.setHours(0, 0, 0, 0));
          const endOfDay = new Date(date.setHours(23, 59, 59, 999));

          const raceData = await HorseRace.findOne({
            horse: horseData._id,
            date: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          });
          if (raceData) {
            raceData.value = horses[i].value;
            raceData.mud = horses[i].mud;

            await raceData.save();
          }
        }
      }
    }
    res.json("Correcciones guardadas");
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.updateDayControl = async (req, res) => {
  const data = req.body;
  const dateId = req.params.id;
  try {
    const dayData = await QuadrantDay.findById(dateId);
    dayData[data.parameter] = !dayData[data.parameter];
    await dayData.save();
    res.json({
      data: dayData,
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.getDayControlByMonth = async (req, res) => {
  const { year, month } = req.params;
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 1);

  try {
    const result = await QuadrantDay.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createTablesDocx = async (req, res) => {
  const date = req.body.date;
  try {
    const horses2022 = await Horse.find({ year: 2022, table: "FRA" }).populate(
      "values"
    );
    const horses2021 = await Horse.find({ year: 2021, table: "FRA" }).populate(
      "values"
    );
    const horses2020 = await Horse.find({ year: 2020, table: "FRA" }).populate(
      "values"
    );
    const horses2019 = await Horse.find({ year: 2019, table: "FRA" }).populate(
      "values"
    );
    const horses2018 = await Horse.find({ year: 2018, table: "FRA" }).populate(
      "values"
    );

    const sortedHorses = (horses) =>
      horses.sort((a, b) => a.name.localeCompare(b.name));

    const doc2022 = createDocument(
      sortedHorses(horses2022),
      `Caballos ${new Date().getFullYear() - 2022} años`
    );
    const doc2021 = createDocument(
      sortedHorses(horses2021),
      `Caballos ${new Date().getFullYear() - 2021} años`
    );
    const doc2020 = createDocument(
      sortedHorses(horses2020),
      `Caballos ${new Date().getFullYear() - 2020} años`
    );
    const doc2019 = createDocument(
      sortedHorses(horses2019),
      `Caballos ${new Date().getFullYear() - 2019} años`
    );
    const doc2018 = createDocument(
      sortedHorses(horses2018),
      `Caballos ${new Date().getFullYear() - 2018} años`
    );

    await Promise.all([
      saveDocument(
        doc2022,
        `Caballos ${new Date().getFullYear() - 2022} años.docx`
      ),
      saveDocument(
        doc2021,
        `Caballos ${new Date().getFullYear() - 2021} años.docx`
      ),
      saveDocument(
        doc2020,
        `Caballos ${new Date().getFullYear() - 2020} años.docx`
      ),
      saveDocument(
        doc2019,
        `Caballos ${new Date().getFullYear() - 2019} años.docx`
      ),
      saveDocument(
        doc2018,
        `Caballos ${new Date().getFullYear() - 2018} años.docx`
      ),
    ]);

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "tipsterofturf@gmail.com",
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: "tipsterofturf@gmail.com",
      to: "partipral@hotmail.com,congeladoseltimon@gmail.com,victor1305@hotmail.com",
      subject: `Tablas actualizadas a ${date}`,
      text: "Tablas actualizadas.",
      attachments: [
        {
          filename: `Caballos ${new Date().getFullYear() - 2022} años.docx`,
          path: `Caballos ${new Date().getFullYear() - 2022} años.docx`,
        },
        {
          filename: `Caballos ${new Date().getFullYear() - 2021} años.docx`,
          path: `Caballos ${new Date().getFullYear() - 2021} años.docx`,
        },
        {
          filename: `Caballos ${new Date().getFullYear() - 2020} años.docx`,
          path: `Caballos ${new Date().getFullYear() - 2020} años.docx`,
        },
        {
          filename: `Caballos ${new Date().getFullYear() - 2019} años.docx`,
          path: `Caballos ${new Date().getFullYear() - 2019} años.docx`,
        },
        {
          filename: `Caballos ${new Date().getFullYear() - 2018} años.docx`,
          path: `Caballos ${new Date().getFullYear() - 2018} años.docx`,
        },
      ],
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Error enviando el correo electrónico" });
      }
      console.log("Correo enviado: " + info.response);

      // Borrar los archivos después de enviar el correo electrónico
      try {
        await Promise.all([
          fs.promises.unlink(
            `Caballos ${new Date().getFullYear() - 2022} años.docx`
          ),
          fs.promises.unlink(
            `Caballos ${new Date().getFullYear() - 2021} años.docx`
          ),
          fs.promises.unlink(
            `Caballos ${new Date().getFullYear() - 2020} años.docx`
          ),
          fs.promises.unlink(
            `Caballos ${new Date().getFullYear() - 2019} años.docx`
          ),
          fs.promises.unlink(
            `Caballos ${new Date().getFullYear() - 2018} años.docx`
          ),
        ]);
        console.log("Archivos borrados después de enviar el correo.");
        res.status(200).json("Email enviado y archivos borrados correctamente");
      } catch (deleteError) {
        console.log(deleteError);
        res.status(500).json({ message: "Error borrando los archivos" });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getDayControlByDay = async (req, res) => {
  const date = req.params.date;
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  try {
    const result = await QuadrantDay.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getDriveValues = async (req, res, next) => {
  const horses = req.body;
  const horsesValues = [];
  try {
    for (let i = 0; i < horses.length; i++) {
      const horseData = await Horse.findOne({
        name: horses[i].horseName.toUpperCase(),
        year: new Date().getFullYear() - parseInt(horses[i].age),
        table: "FRA",
      }).populate({
        path: "values",
        options: { sort: { date: -1 }, limit: 10 },
      });

      if (horseData) {
        horsesValues.push({
          row: horses[i].row,
          name: horses[i].horseName,
          values: horseData.values,
        });
      }
    }
    res.json(horsesValues);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.getDrivesRests = async (req, res, next) => {
  const horses = req.body;
  try {
    for (let i = 0; i < horses.length; i++) {
      if (horses[i].age) {
        const horseData = await Horse.findOne({
          name: horses[i].horseName.toUpperCase(),
          year: new Date().getFullYear() - parseInt(horses[i].age),
          table: "FRA",
        });

        if (horseData) {
          const day = horses[i].date.substring(0, 2);
          const month = horses[i].date.substring(2, 4);
          const year = horses[i].date.substring(4, 8);
          const date = new Date(year, month - 1, day);

          const startOfDay = new Date(date.setHours(0, 0, 0, 0));
          const endOfDay = new Date(date.setHours(23, 59, 59, 999));

          const raceData = await HorseRace.findOne({
            horse: horseData._id,
            date: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          });

          raceData.driveRest = horses[i].rest;
          raceData.isBoldDrive = horses[i].isBold;

          await raceData.save();
        }
      }
    }
    res.json("Restas guardadas");
  } catch (error) {
    console.error(error);
    next(error);
  }
};

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
  const endDate = new Date(year, month, 1);

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
          from: "races",
          localField: "horses.races",
          foreignField: "_id",
          as: "horses.races",
        },
      },
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
          "horses.races": {
            $filter: {
              input: "$horses.races",
              as: "race",
              cond: {
                $and: [
                  { $ne: ["$$race.date", "$date"] },
                  { $lte: ["$$race.date", endDate] },
                ],
              },
            },
          },
          "horses.values": {
            $filter: {
              input: "$horses.values",
              as: "value",
              cond: {
                $and: [
                  { $ne: ["$$value.date", "$date"] },
                  { $lte: ["$$value.date", endDate] },
                ],
              },
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
  const dateFormatted = new Date(date);

  const startOfDay = new Date(dateFormatted.setHours(0, 0, 0, 0));
  const endOfDay = new Date(dateFormatted.setHours(23, 59, 59, 999));
  try {
    const existingRace = await Race.findOne({
      racecourseCode: racecourseCode,
      number: number,
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
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
        if (
          participants[j].race === "PUR-SANG" &&
          participants[j].supplement > 0
        ) {
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
            horseRace.supplement = true;
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

exports.editValue = async (req, res) => {
  let value = req.body.value;
  const field = req.body.field;
  const valueID = req.params.id;

  if (field === "corde") {
    value = value.includes("derecha")
      ? "CORDE_DROITE"
      : value.includes("izquierda")
      ? "CORDE_GAUCHE"
      : "LIGNE DROITE";
  }

  if (field === "jockey" || field === "trainer" || field === "raceType") {
    value = value.toUpperCase().trim();
  }

  try {
    const valueData = await HorseRace.findById(valueID);
    valueData[field] = value;
    await valueData.save();

    res.json(valueData);
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.createHorseRace = async (req, res) => {
  const horseId = req.params.id;
  const race = req.body;

  try {
    const horseData = await Horse.findById(horseId);
    const raceData = new HorseRace({
      horse: horseData._id,
      ...(race.complements && { complements: race.complements }),
      ...(race.box && { box: parseInt(race.box) }),
      ...(race.jockey && { jockey: race.jockey.toUpperCase().trim() }),
      ...(race.unload && { unload: parseInt(race.unload) }),
      ...(race.weight && { weight: parseInt(race.weight) }),
      ...(race.trainer && { trainer: race.trainer.toUpperCase().trim() }),
      ...(race.racecourse && {
        racecourse: race.racecourse.toUpperCase().trim(),
      }),
      ...(race.corde && {
        corde: race.corde.includes("derecha")
          ? "CORDE_DROITE"
          : race.corde.includes("izquierda")
          ? "CORDE_GAUCHE"
          : "LIGNE DROITE",
      }),
      ...(race.distance && { distance: parseInt(race.distance) }),
      ...(race.raceType && { raceType: race.raceType.toUpperCase() }),
      ...(race.notes && { notes: race.notes }),
      ...(race.position && { position: race.position }),
      ...(race.measurement && { measurement: race.measurement }),
      ...(race.bonnet && { bonnet: race.bonnet }),
      ...(race.attacheLangue && { attacheLangue: race.attacheLangue }),
      mud: race.mud,
      surface: race.surface,
      date: race.date,
      value: race.value.trim(),
    });

    await raceData.save();

    const allRaces = await HorseRace.find({ horse: horseData._id });
    allRaces.sort((a, b) => new Date(a.date) - new Date(b.date));
    const sortedRaceIds = allRaces.map((race) => race._id);
    horseData.values = sortedRaceIds;

    await horseData.save();
    res.json(raceData);
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.addResultsByDate = async (req, res) => {
  const date = req.body.date;
  const races = await fetch(
    `https://online.turfinfo.api.pmu.fr/rest/client/62/programme/${date}?meteo=true&specialisation=OFFLINE`
  );

  const racesParsed = await races.json();

  if (!racesParsed.programme) {
    return res.status(400).json({ error: "Esta fecha no está disponible" });
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
        const time = new Date(raceInfo.heureDepart);
        const hour = time.getHours();
        const minutes = time.getMinutes();
        const day = parseInt(date.substring(0, 2));
        const month = parseInt(date.substring(2, 4)) - 1;
        const year = parseInt(date.substring(4, 8));

        const isoDate = new Date(year, month, day, hour, minutes).toISOString();

        const existingRace = await exports.checkExistingRace(
          raceInfo.hippodrome.codeHippodrome,
          raceInfo.numOrdre,
          isoDate
        );

        if (existingRace && raceInfo.arriveeDefinitive) {
          existingRace.duration = raceInfo.dureeCourse;
          existingRace.result = raceInfo.ordreArrivee;
          existingRace.measurement = raceInfo.penetrometre?.intitule || "";
          existingRace.measurementValue =
            raceInfo.penetrometre?.valeurMesure || "";

          for (let j = 0; j < participants.length; j++) {
            const horseData = await Horse.findOne({
              name: participants[j].nom.toUpperCase(),
              year: new Date().getFullYear() - participants[j].age,
              table: "FRA",
            });

            if (
              horseData &&
              (!horseData.mother ||
                !horseData.father ||
                !horseData.genre ||
                !horseData.grandFather)
            ) {
              horseData.mother = participants[j].nomMere || "";
              horseData.father = participants[j].nomPere || "";
              horseData.grandFather = participants[j].nomPereMere || "";
              horseData.genre = participants[j].sexe || "";
              await horseData.save();
            }

            if (horseData) {
              const dateFormatted = new Date(isoDate);
              const startOfDay = new Date(dateFormatted.setHours(0, 0, 0, 0));
              const endOfDay = new Date(
                dateFormatted.setHours(23, 59, 59, 999)
              );
              const horseRaceData = await HorseRace.findOne({
                horse: horseData._id,
                date: {
                  $gte: startOfDay,
                  $lt: endOfDay,
                },
              });

              if (horseRaceData) {
                horseRaceData.position = participants[j].ordreArrivee;
                horseRaceData.distanceHorsePrecedent =
                  participants[j].distanceChevalPrecedent?.libelleCourt || "";
                horseRaceData.measurement =
                  raceInfo.penetrometre?.intitule || "";
                horseRaceData.measurementValue =
                  raceInfo.penetrometre?.valeurMesure || "";
                await horseRaceData.save();
              }
            }
          }
        }
      }
      const dateFormatted = new Date(
        date.substring(4, 8),
        date.substring(2, 4) - 1,
        date.substring(0, 2)
      );
      const startDate = new Date(dateFormatted);
      const endDate = new Date(dateFormatted);
      endDate.setDate(endDate.getDate() + 1);

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
            from: "races",
            localField: "horses.races",
            foreignField: "_id",
            as: "horses.races",
          },
        },
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
            "horses.races": {
              $filter: {
                input: "$horses.races",
                as: "race",
                cond: {
                  $and: [
                    { $ne: ["$$race.date", "$date"] },
                    { $lte: ["$$race.date", endDate] },
                  ],
                },
              },
            },
            "horses.values": {
              $filter: {
                input: "$horses.values",
                as: "value",
                cond: {
                  $and: [
                    { $ne: ["$$value.date", "$date"] },
                    { $lte: ["$$value.date", endDate] },
                  ],
                },
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
      return res
        .status(400)
        .json({ error: "Ha habido un error actualizando el día" });
    }
  }
};

exports.createRacesByDate = async (req, res) => {
  const date = req.body.date;
  const races = await fetch(
    `https://online.turfinfo.api.pmu.fr/rest/client/62/programme/${date}?meteo=true&specialisation=OFFLINE`
  );
  const equidiaOptions = {
    authority: "api.equidia.fr",
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    Origin: "https://www.equidia.fr",
    Priority: "u=1, i",
    Referer: "https://www.equidia.fr/",
  };
  const racesPMH = await fetch(
    `https://api.equidia.fr/api/public/dailyreunions/${`${date.slice(
      4
    )}-${date.slice(2, 4)}-${date.slice(0, 2)}`}`,
    { method: "GET", headers: equidiaOptions }
  );
  const racesPMHParsed = await racesPMH.json();
  const listPMHReunions = [];
  for (let i = 0; i < racesPMHParsed.length; i++) {
    if (
      racesPMHParsed[i].pays_site_reunion.toUpperCase() === "FRA" &&
      racesPMHParsed[i].specialite_reunion.toLowerCase() !== "trot"
    ) {
      for (let j = 0; j < racesPMHParsed[i].courses_by_day.length; j++) {
        if (
          racesPMHParsed[i].courses_by_day[j].discipline.toLowerCase() ===
            "plat" &&
          racesPMHParsed[i].courses_by_day[j].is_pmh
        ) {
          listPMHReunions.push(
            `R${racesPMHParsed[i].num_reunion}/C${racesPMHParsed[i].courses_by_day[j].num_course_pmu}`
          );
        }
      }
    }
  }

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
      const day = parseInt(date.substring(0, 2));
      const month = parseInt(date.substring(2, 4)) - 1;
      const year = parseInt(date.substring(4, 8));

      for (let i = 0; i < listReunions.length; i++) {
        const raceUrl = `https://online.turfinfo.api.pmu.fr/rest/client/62/programme/${date}/${listReunions[i]}/participants?specialisation=OFFLINE`;
        const raceUrlEqui = `https://api.equidia.fr/api/public/v2/courses/${`${date.slice(
          4
        )}-${date.slice(2, 4)}-${date.slice(0, 2)}`}/${listReunions[i]}`;
        const raceResponse = await fetch(raceUrl);
        const raceEquiResponse = await fetch(raceUrlEqui, {
          method: "GET",
          headers: equidiaOptions,
        });
        const raceResponseParsed = await raceResponse.json();
        const raceResponseEquiParsed = await raceEquiResponse.json();
        const participants = raceResponseParsed.participants;
        const participantsEqui = raceResponseEquiParsed.partants;
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

        const isoDate = getSpanishTime(year, month, day, hour, minutes);
        const partantsFormatted = [];
        const existingRace = await exports.checkExistingRace(
          raceInfo.hippodrome.codeHippodrome,
          raceInfo.numOrdre,
          isoDate.toISOString()
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
            corde: raceInfo.corde,
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
                  bonnet: participantsEqui[j].bonnet,
                  attacheLangue: participantsEqui[j].attache_langue,
                  ...(participants[j].supplement > 0 && { supplement: true }),
                  ...(participants[j].indicateurInedit && { debut: true }),
                });

                if (
                  !horseData.mother ||
                  !horseData.father ||
                  !horseData.genre ||
                  !horseData.grandFather
                ) {
                  horseData.mother =
                    participants[j].nomMere.toUpperCase() || "";
                  horseData.father =
                    participants[j].nomPere.toUpperCase() || "";
                  horseData.grandFather =
                    participants[j].nomPereMere.toUpperCase() || "";
                  horseData.genre = participants[j].sexe.toUpperCase() || "";
                }

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
                  mother: participants[j].nomMere.toUpperCase() || "",
                  father: participants[j].nomPere.toUpperCase() || "",
                  grandFather: participants[j].nomPereMere.toUpperCase() || "",
                  genre: participants[j].sexe || "",
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
                  bonnet: participantsEqui[j].bonnet,
                  attacheLangue: participantsEqui[j].attache_langue,
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
      for (let i = 0; i < listPMHReunions.length; i++) {
        const racePMHurl = `https://api.equidia.fr/api/public/v2/courses/${`${date.slice(
          4
        )}-${date.slice(2, 4)}-${date.slice(0, 2)}`}/${listPMHReunions[i]}`;
        const racePMHResponse = await fetch(racePMHurl, {
          method: "GET",
          headers: equidiaOptions,
        });
        const racePMHResponseParsed = await racePMHResponse.json();
        let racingTrack = "Hierba";
        const participants = racePMHResponseParsed.partants;
        if (
          racePMHResponseParsed.lib_piste_course.toLowerCase() !== "herbe" ||
          racePMHResponseParsed.reunion.lib_reunion.toLowerCase() ===
            "pompadour"
        ) {
          racingTrack = "PSF";
        }

        for (let j = 0; j < participants.length; j++) {
          if (
            !racePMHResponseParsed.conditions_txt_course
              .toLowerCase()
              .includes("arabe") ||
            !racePMHResponseParsed.conditions_txt_course
              .toLowerCase()
              .includes("waho")
          ) {
            const horseData = await Horse.findOne({
              name: participants[j].cheval.nom_cheval.toUpperCase(),
              year:
                new Date().getFullYear() - participants[j].cheval.age_cheval,
              table: "FRA",
            });
            if (horseData) {
              const startOfDay = new Date(year, month, day, 0, 0, 0, 0); // Inicio del día (00:00)
              const endOfDay = new Date(year, month, day, 23, 59, 59, 999); // Fin del día (23:59)

              const checkRace = await HorseRace.findOne({
                horse: horseData._id, // Filtra por ID del caballo
                date: {
                  // Comprobar si la carrera está en ese día
                  $gte: startOfDay, // Fecha mayor o igual al inicio del día
                  $lt: endOfDay, // Fecha menor al final del día
                },
              });
              const time = new Date(racePMHResponseParsed.real_heure_course);
              const hour = time.getHours();
              const minutes = time.getMinutes();
              const isoDate = getSpanishTime(year, month, day, hour, minutes);
              if (!checkRace) {
                const horseRaceData = new HorseRace({
                  number: participants[j].num_partant,
                  horse: horseData._id,
                  complements:
                    participants[j].oeil_partant === "O"
                      ? "BR"
                      : participants[j].oeil_partant === "A"
                      ? "CA"
                      : "",
                  box: parseInt(participants[j].place_corde_partant),
                  jockey: participants[j].monte.nom_monte,
                  unload: participants[j].pds_cond_monte_partant,
                  weight: participants[j].pds_calc_hand_partant,
                  trainer: participants[j].entraineur.nom_entraineur,
                  racecourseCode: racePMHResponseParsed.reunion.lib_reunion,
                  racecourse: racePMHResponseParsed.reunion.lib_reunion,
                  corde: racePMHResponseParsed.lib_corde_course.toUpperCase(),
                  race: racePMHResponseParsed.num_course_pmu,
                  distance: racePMHResponseParsed.distance,
                  raceType: racePMHResponseParsed.categ_course,
                  surface: racingTrack,
                  value: "prov",
                  date: isoDate,
                  isPMH: true,
                  bonnet: participants[j].bonnet,
                  attacheLangue: participants[j].attache_langue,
                  ...(participants[j].type_eng === "S" && { supplement: true }),
                });

                const horseRaceDataSaved = await horseRaceData.save();
                horseData.values = horseData.values.concat(
                  horseRaceDataSaved._id
                );
                await horseData.save();
              }
            } else {
              const newHorse = new Horse({
                name: participants[j].nom_cheval.toUpperCase(),
                year: new Date().getFullYear() - participants[j].age_cheval,
                table: "FRA",
              });
              const newHorseSaved = await newHorse.save();
              const horseRaceData = new HorseRace({
                number: participants[j].num_partant,
                horse: newHorseSaved._id,
                complements:
                  participants[j].oeil_partant === "O"
                    ? "BR"
                    : participants[j].oeil_partant === "A"
                    ? "CA"
                    : "",
                box: parseInt(participants[j].place_corde_partant),
                jockey: participants[j].monte.nom_monte,
                unload: participants[j].pds_cond_monte_partant,
                weight: participants[j].pds_calc_hand_partant,
                trainer: participants[j].entraineur.nom_entraineur,
                racecourseCode: racePMHResponseParsed.reunion.lib_reunion,
                racecourse: racePMHResponseParsed.reunion.lib_reunion,
                corde: racePMHResponseParsed.lib_corde_course.toUpperCase(),
                race: racePMHResponseParsed.num_course_pmu,
                distance: racePMHResponseParsed.distance,
                raceType: racePMHResponseParsed.categ_course,
                surface: racingTrack,
                value: "prov",
                date: isoDate,
                isPMH: true,
                bonnet: participants[j].bonnet,
                attacheLangue: participants[j].attache_langue,
                ...(participants[j].type_eng === "S" && { supplement: true }),
              });
              const horseRaceDataSaved = await horseRaceData.save();
              newHorseSaved.values = newHorseSaved.values.concat(
                horseRaceDataSaved._id
              );
              await newHorseSaved.save();
            }
          }
        }
      }
      const dayFormatted = new Date(year, month, day);
      const startOfDay = new Date(dayFormatted.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dayFormatted.setHours(23, 59, 59, 999));

      const hasQuadrantDayData = await QuadrantDay.findOne({
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });
      if (!hasQuadrantDayData) {
        const quadrantDayData = new QuadrantDay({
          date: new Date(year, month, day).toISOString(),
          day: parseInt(day),
          notes: false,
          saved: false,
          corrections: false,
        });
        await quadrantDayData.save();
      }
      res.json({
        msg: "Jornada creada correctamente",
      });
    } catch (error) {
      console.log(error);
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

const createDocument = (data, title) => {
  const table = new Table({
    columnWidths: [2500, 6500],
    rows: data.map((item) => {
      const concatenatedValues = item.values.flatMap((val, index) => {
        const textRunOptions = {
          text: val.value,
          font: "Arial",
          size: 24, // 12 puntos (pt) = 24 half-points
          bold: val.surface === "PSF",
        };

        if (val.mud) {
          textRunOptions.shading = {
            type: ShadingType.CLEAR,
            fill: "FFFF00", // Color amarillo
          };
        }

        const textRuns = [new TextRun(textRunOptions)];

        if (index < item.values.length - 1) {
          textRuns.push(
            new TextRun({
              text: "-",
              font: "Arial",
              size: 24, // 12 puntos (pt) = 24 half-points
            })
          );
        }

        return textRuns;
      });

      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.name,
                    font: "Arial",
                    size: 24, // 12 puntos (pt) = 24 half-points
                  }),
                ],
                spacing: { after: 100 },
              }),
            ],
            width: { size: 2500, type: WidthType.DXA }, // 5 cm
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: concatenatedValues,
                spacing: { after: 100 }, // Espacio después del párrafo
              }),
            ],
            width: { size: 6500, type: WidthType.DXA }, // 13 cm
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
            },
          }),
        ],
      });
    }),
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
    },
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                font: "Arial",
                size: 28, // Título un poco más grande
                bold: true, // Título en negrita
              }),
            ],
            alignment: "center", // Centrar el título
          }),
          new Paragraph({
            // Párrafo vacío para añadir un espacio entre el título y la tabla
            text: "",
            spacing: { after: 200 }, // Espacio después del título
          }),
          table,
        ],
      },
    ],
  });

  return doc;
};

exports.removeValue = async (req, res) => {
  const { horseId, horseRaceId } = req.params;

  try {
    // Paso 1: Buscar el HorseRace y eliminarlo
    const deletedHorseRace = await HorseRace.findByIdAndDelete(horseRaceId);

    if (!deletedHorseRace) {
      return res.status(404).json({ message: "HorseRace no encontrado" });
    }

    // Paso 2: Actualizar el Horse eliminando la referencia al HorseRace en values
    const updatedHorse = await Horse.findByIdAndUpdate(
      horseId,
      {
        $pull: { values: horseRaceId }, // Elimina la referencia en la lista de values
      },
      { new: true } // Devuelve el documento actualizado
    );

    if (!updatedHorse) {
      return res.status(404).json({ message: "Caballo no encontrado" });
    }

    res.json({
      message: "HorseRace eliminado y caballo actualizado correctamente",
      updatedHorse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error eliminando la carrera" });
  }
};

exports.removeDuplicates = async (req, res, next) => {
  try {
    // Encuentra todas las carreras agrupadas por caballo y fecha
    const duplicados = await HorseRace.aggregate([
      {
        $group: {
          _id: { horse: "$horse", date: "$date" },
          ids: { $push: "$_id" }, // Almacena los IDs de las carreras
          values: { $push: "$value" }, // Almacena los valores para filtrarlos después
          count: { $sum: 1 }, // Cuenta cuántas carreras tienen mismo caballo y fecha
        },
      },
      {
        $match: { count: { $gt: 1 } }, // Solo las que están duplicadas
      },
    ]);

    // Iterar sobre los duplicados encontrados
    for (const duplicado of duplicados) {
      const ids = duplicado.ids;
      const values = duplicado.values;

      // Filtrar las carreras con `value === "prov"`
      const provIds = ids.filter((_, index) => values[index] === "prov");

      if (provIds.length > 1) {
        // Si hay más de una carrera con `value === "prov"`, eliminamos todas menos una
        for (let i = 1; i < provIds.length; i++) {
          const idToDelete = provIds[i];
          await HorseRace.findByIdAndDelete(idToDelete);

          // También eliminar la referencia en el modelo Horse
          await Horse.updateMany(
            { values: idToDelete },
            { $pull: { values: idToDelete } }
          );
        }
      } else if (provIds.length === 1) {
        // Si hay solo una carrera con "prov", la eliminamos preferentemente
        const idToDelete = provIds[0];
        await HorseRace.findByIdAndDelete(idToDelete);

        // Eliminar la referencia en el modelo Horse
        await Horse.updateMany(
          { values: idToDelete },
          { $pull: { values: idToDelete } }
        );
      } else {
        // Si no hay ninguna con "prov", eliminamos la primera entrada encontrada
        const idToDelete = ids[0];
        await HorseRace.findByIdAndDelete(idToDelete);

        // Eliminar la referencia en el modelo Horse
        await Horse.updateMany(
          { values: idToDelete },
          { $pull: { values: idToDelete } }
        );
      }
    }

    res.json({ message: "Duplicados eliminados con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar duplicados" });
  }
};

const saveDocument = async (doc, filePath) => {
  return Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(filePath, buffer);
    console.log(`El archivo ${filePath} ha sido creado exitosamente.`);
  });
};

const getSpanishTime = (year, month, day, hour, minutes) => {
  const date = new Date(Date.UTC(year, month, day, hour, minutes));
  return date;
};
