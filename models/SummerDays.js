const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const summerDaysSchema = new Schema(
  {
    day: {
      type: Number,
    },
    events: [
      {
        type: mongoose.ObjectId,
        ref: "SummerEvents",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SummerDays = mongoose.model("SummerDays", summerDaysSchema);

module.exports = SummerDays;
