const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parameterBetCodeSchema = new Schema({
    betCode: {
        type: String,
        required: true
    },
}, {
    timestamps: true
})

const ParameterBetCode = mongoose.model("betCode", parameterBetCodeSchema)

module.exports = ParameterBetCode