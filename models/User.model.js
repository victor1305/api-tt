const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    lastName: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: Number
    },
    role: {
        type: String,
        default: "user"
    },
    receipts: [
        {
            type: mongoose.ObjectId,
            ref: "PayInfo"
        }
    ]
}, {
    timestamps: true
})

const User = mongoose.model("User", userSchema)

module.exports = User