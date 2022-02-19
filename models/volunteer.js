const mongoose = require('mongoose');
const Schema = mongoose.Schema; 
const volunteerSchema=new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    gender: String,
    dob: {
        type: String,
        required: true,
    },
    occupation: String,
    city: String,
    state: String,
    fieldInterest: [String],
})

const volunteers = mongoose.model("Volunteer",volunteerSchema);
module.exports = volunteers;