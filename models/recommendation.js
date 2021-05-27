const mongoose = require('mongoose');

// Recommendation Schema
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

const Recommendation = module.exports = mongoose.model('recommendations', RecommendationSchema);