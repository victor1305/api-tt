const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const summerEventsSchema = new Schema(
  {
    title: {
      type: String,
      require: true,
    },
    startHour: {
      type: String,
      require: true,
    },
    startMinute: {
      type: String,
      require: true,
    },
    finishHour: {
      type: String,
    },
    finishMinute: {
      type: String,
    },
    assistants: [String],
    createdBy: {
      type: mongoose.ObjectId,
      ref: "SummerUsers",
    }
  },
  {
    timestamps: true,
  }
);

const SummerEvents = mongoose.model("SummerEvents", summerEventsSchema);

module.exports = SummerEvents;
