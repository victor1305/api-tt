const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const quadrantDaySchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    day: {
      type: Number
    },
    notes: {
      type: Boolean
    },
    saved: {
      type: Boolean
    },
    corrections: {
      type: Boolean
    }
  },
  {
    timestamps: true,
  }
);

const QuadrantDay = mongoose.model("QuadrantDay", quadrantDaySchema);

module.exports = QuadrantDay;