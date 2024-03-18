const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payInfoSchema = new Schema(
  {
    client: {
      type: mongoose.ObjectId,
      ref: "Client",
    },
    date: {
      type: Date,
    },
    status: {
      type: String,
      default: "Pendiente",
    },
    price: {
      type: Number,
      default: 40,
    },
    type: {
      type: String,
    },
    beneficiary: {
      type: mongoose.ObjectId,
      ref: "User",
    },
    information: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PayInfo = mongoose.model("PayInfo", payInfoSchema);

module.exports = PayInfo;
