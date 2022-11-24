const mongoose = require("mongoose")
const Schema = mongoose.Schema

const clientSchema = new Schema({
  name: {
    type: String
  },
  phone: {
    type: Number
  },
  registerDate: {
    type: Date
  },
  referred: {
    type: String,
    default: null
  },
  payments: [{
    type: mongoose.ObjectId,
    ref: "PayInfo"
  }]
}, {
  timestamps: true
})

const Client = mongoose.model("Client", clientSchema)

module.exports = Client