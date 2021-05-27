const mongoose = require('mongoose');

//const defaultHourlyUsage = new Array(336).fill(0);
//const defaultPowerGoals = new Array(7).fill(0);

const RecommendationSchema = mongoose.Schema({
    name:{
        type: String, // Name of the recommendation
        required: true,
        default: "No recommendation"
    },
    day_array:{
        type: Array, // 7 bit array representing if the rule is enabled on that day
        required: true,
        default: [0,0,0,0,0,0,0]
    },
    act:{
        type: Array, // 2 item array of the actions to be done at the start and end of the rule 0 being off 1 being on
        required: false,
    },
    min:{
        type: Array, // 2 item array of the times past midnight in minutes
        required: false,
        default: [0,0]
    },

    time_opt:{
        type: Array, // 2 item array of if it should be at sunrise, sunset or set by ourselves (we are always going to be the last option which is [0,0])
        required: false,
    },

    message:{
        type: String, // Message in body of array
        required: false
    },
    boolean_check:{
        type: Boolean,
        required: false, // Boolean check
        default: true
    },

    power_goal:{
        type: Number,
        required: false
    }

});

// Appliance Schema
const ApplianceSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        default: "undefined"
    },
    alias: {
        type: String,
        required: true
    },
    oem_id: {
        type: String,
        required: true
    },
    hourly_usage: {
        type: Array,
        required: false
    },
    cumulative_usage: {
        type: Array,
        required: true
    },
    hours_passed: {
        type: Number,
        required: true,
        default: 0
    },
    power_goals: {
        type: Array,
        required: false
    },
    current_day: {
        type: Number,
        required: true
    },
    current_month: {
        type: Number,
        required: true
    },
    current_year: {
        type: Number,
        required: true
    },
    favourite: {
        type: Boolean,
        required: true,
        default: false
    },
    recommendations: [RecommendationSchema]
});


const Appliance = module.exports = mongoose.model('appliances', ApplianceSchema);
