const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parameterStakeSchema = new Schema({
    stake: {
        type: Number,
        required: true
    },
}, {
    timestamps: true
})

const ParameterStake = mongoose.model("stake", parameterStakeSchema)

module.exports = ParameterStake