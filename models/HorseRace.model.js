const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const horseRaceSchema = new Schema(
  {
    number: {
      type: Number,
    },
    horse: {
      type: mongoose.ObjectId,
      ref: "Horse",
    },
    complements: {
      type: String,
    },
    box: {
      type: Number,
    },
    jockey: {
      type: String,
    },
    unload: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    trainer: {
      type: String,
    },
    value: {
      type: String,
    },
    rest: {
      type: String,
    },
    notes: {
      type: String,
    },
    position: {
      type: Number,
    },
    racecourseCode: {
      type: String,
    },
    racecourse: {
      type: String,
    },
    supplement: {
      type: Boolean,
    },
    corde: {
      type: String,
    },
    race: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    raceType: {
      type: String,
    },
    surface: {
      type: String,
    },
    measurement: {
      type: String,
    },
    measurementValue: {
      type: String,
    },
    distanceHorsePrecedent: {
      type: String,
    },
    mud: {
      type: Boolean,
    },
    date: {
      type: Date,
    },
    debut: {
      type: Boolean,
    },
    driveRest: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const HorseRace = mongoose.model("HorseRace", horseRaceSchema);

module.exports = HorseRace;
