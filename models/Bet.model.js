const mongoose = require("mongoose")
const Schema = mongoose.Schema

const betSchema = new Schema({
    bookie: {
        type: String
    },    
    racecourse: {
        type: String
    },
    race: {
        type: String
    },
    betName: {
        type: String
    },
    stake: {
        type: Number
    },
    price: {
        type: Number
    },
    date: {
        type: Date,
        default:  Date.now
    },
    status: {
        type: String,
        default: "pending"
    },
    profit: {
        type: Number,
        default: 0
    },
    betCode: {
        type: String
    },
    position: {
        type: String
    }

    },{
        timestamps: true,
    }
)

const Bet = mongoose.model("Bet", betSchema)

module.exports = Bet