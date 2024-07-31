const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const summerUsersSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    eventsCreated: [
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

const SummerUsers = mongoose.model("SummerUsers", summerUsersSchema);

module.exports = SummerUsers;
