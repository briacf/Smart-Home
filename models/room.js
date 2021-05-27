const mongoose = require('mongoose');

// User Schema
const RoomSchema = mongoose.Schema({
    email:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    color:{
        type: String,
        required: true
    },
    date_added:{
        type: Date,
        required: true
    },
    device_oem_ids:{
        type: Array,
        required: false
    },last_accessed:{
        type: Date,
        required: true
    },
});

const Room = module.exports = mongoose.model('rooms', RoomSchema);