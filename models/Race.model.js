const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const raceSchema = new Schema(
  {
    racecourseCode: {
      type: String,
    },
    racecourse: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    raceType: {
      type: String,
    },
    corde: {
      type: String,
    },
    duration: {
      type: Number,
    },
    result: {
      type: Array,
    },
    distance: {
      type: Number,
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
    time: {
      type: String,
    },
    horses: [
      {
        type: mongoose.ObjectId,
        ref: "Horse",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Race = mongoose.model("Race", raceSchema);

module.exports = Race;
