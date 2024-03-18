const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const horseRaceSchema = new Schema(
  {
    number: {
      type: Number
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
      type: String,
    },
    racecourse: {
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
    mud: {
      type: Boolean
    },
    date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const HorseRace = mongoose.model("HorseRace", horseRaceSchema);

module.exports = HorseRace;
