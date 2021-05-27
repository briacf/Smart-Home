const mongoose = require('mongoose');

// User Schema
const UserSchema = mongoose.Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    firstname:{
        type: String,
        required: true,
        default: "Default"
    },
    lastname:{
        type: String,
        required: true,
        default: "Name"
    },
    profile_pic:{
        type: String,
        required: true,
        default: "default-profile.png" // filename
    },
    cover_pic:{
        type: String,
        required: true,
        default: "default-cover.png" // filename
    },
    device_state_notifs:{
        type: Boolean,
        required: true,
        default: true
    },
    usage_recommendation_notifs:{
        type: Boolean,
        required: true,
        default: true
    }, credits:{
        type: Number,
        required: true,
        default: 0
    }, tutorial_completed:{
        type: Boolean,
        required: true,
        default: false
    }
});

const User = module.exports = mongoose.model('users', UserSchema);