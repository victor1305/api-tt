const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const horseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    year: {
      type: Number
    },
    table: {
      type: String
    },
    mother: {
      type: String
    },
    father: {
      type: String
    },
    grandFather: {
      type: String
    },
    genre: {
      type: String
    },
    values: [
      {
        type: mongoose.ObjectId,
        ref: "HorseRace",
      },
    ],
    races: [
      {
        type: mongoose.ObjectId,
        ref: "Race",
      },
    ]
  },
  {
    timestamps: true,
  }
);

const Horse = mongoose.model("Horse", horseSchema);

module.exports = Horse;
