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
    gender: Boolean,
    dob: {
        type: Date,
        required: trequestAnimationFrame,
    },
    occupation: Boolean,
    city: String,
    state: String,
    fieldInterest:Boolean,
})

const volunteers=mongoose.model("Volunteer",volunteerSchema);
module.exports=volunteers;


