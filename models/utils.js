const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const utilSchema=new Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        required: true,
    },
    phnumber:{
        type: Number,
        length:10,
        required: true
    },
    city:{
        type:String,
        required:true
    },
    pincode:{
        type:String,
        required:true, 
    },
    food:{
        type:Boolean,
    },
    clothes:{
        type: Boolean,
    },
    other:{
        type: String,
    }
})
const util=mongoose.model("Util",utilSchema)
module.exports=util