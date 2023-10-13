const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const personalBetSchema = new Schema(
  {
    bookie: {
      type: String,
    },
    initialBalance: {
      type: Number,
    },
    deposits: {
      type: Number,
      default: 0,
    },
    withdraws: {
      type: Number,
      default: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
    finalBalance: {
      type: Number,
    },
    userId: {
      type: String,
      require: true
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const personalBet = mongoose.model("PersonalBet", personalBetSchema);

module.exports = personalBet;
