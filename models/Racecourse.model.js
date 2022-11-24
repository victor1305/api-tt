const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parameterRacecourseSchema = new Schema({
    racecourse: {
        type: String,
        required: true
    },
}, {
    timestamps: true
})

const ParameterRacecourse = mongoose.model("racecourse", parameterRacecourseSchema)

module.exports = ParameterRacecourse