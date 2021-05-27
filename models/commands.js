var express = require('express');
var router = express.Router()

function commandGen(devCom, devModel, state=1, brightness=10, color="white", 
hue, saturation, color_temp, year, month, day, alias, ruleName, dayArray, 
repeat, enable, rule_id, start, end) {
    var command;
    state = state*1;
    if(alias != null && devModel != null) {
        var ruleDisplayName = alias.concat(devModel);
    }

    if(devModel == "HS110") {
        switch(devCom) {
            case "toggle":
                command = {"system":{"set_relay_state":{"state":state}}};
                break;
            case "info":
                command = {"system":{"get_sysinfo":{}}};
                break;
            case "realtime":
                command = {"emeter":{"get_realtime":{}}};
                break;
            case "day_use":
                command = {"emeter":{"get_daystat":{"month":month*1,"year":year*1}}};
                break;
            case "time":
                command = {"time":{"get_time":{}}};
                break;
            case "month_use":
                command = {"emeter":{"get_monthstat":{"year":year*1}}};
                break;
            case "schedule":
                command = {"schedule":{"add_rule":
                {"stime_opt":0, // Default 0 (independent) regards if use sunrise/sunset/independent as start time
                "wday":dayArray,
                "smin":start, // start time in minutes after midnight
                "enable":1, // // If rule is active enable
                "repeat":repeat, // Whether the rule wll be used more than once (daily)
                "etime_opt": 0, // End time independent of sun
                "name":ruleDisplayName,
                "eact":0,  // Turn device off at end of rule
                "month":0,
                "sact":state, // Feed the wanted state of the device with 0 off and 1 on
                "year":0,
                "longitude":0,
                "day":0,
                "force":0,
                "latitude":0,
                "emin":end}, // end time in minutes after midnight
                "set_overall_enable":{"enable":1}}} // Overall enable for schedule rules
                break;
            case "change_alias":
                command = {"system":{"set_dev_alias":{"alias":alias}}};
                
        }
    }   

    if(devModel == "LB130") {
        switch (devCom) {
            case "toggle":
                command = {"smartlife.iot.smartbulb.lightingservice":{"transition_light_state":{"on_off":state}}};
                break;
            case "transition":
                command = {"smartlife.iot.smartbulb.lightingservice":{"transition_light_state":
                {"transition_period":100,
                "hue":hue*1,
                "on_off":state,
                "saturation":saturation*1,
                "color_temp":color_temp*1,
                "brightness":brightness*10}}}  ;
                break;
            case "brightness":
                command = {"smartlife.iot.smartbulb.lightingservice":{"transition_light_state":
                {"brightness":brightness*10}}}  ;
                break;
            case "light_details1":
                command = {"smartlife.iot.smartbulb.lightingservice":{"get_light_details":""}};
                break;
            case "light_details2":
                command = {"smartlife.iot.smartbulb.lightingservice":{"get_light_state":""}};
            case "emeter":
                command = {"smartlife.iot.common.emeter":{"get_daystat":{"year":year*1,"month":month*1}}};
                break;
            case "set_alias":
                command = {"smartlife.iot.common.system":{"set_dev_alias":{"alias":alias}}};
                break;
            case "get_info":
                command = {"system":{"get_sysinfo":""}};
                break;
            case "schedule":
                command = {"smartlife.iot.common.schedule":{"get_rules":""}};
                break;
            case "add_schedule_rule":
                command = {"smartlife.iot.common.schedule":{"add_rule":
                {"name":ruleDisplayName,
                "repeat":repeat, // Whether the rule wll be used more than once (daily)
                "wday":dayArray,
                "stime_opt":0, // Default 0 (independent) regards if use sunrise/sunset/independent as start time
                "eact":0,  // Turn device off at end of rule
                "smin":start, // start time in minutes after midnight
                "s_light":{"saturation":saturation*1,"hue":hue*1,"brightness":brightness*1,"color_temp":color_temp*1,"on_off":state},
                "enable":enable*1, // If rule is active enable
                "day":day*1,
                "year":year*1,
                "month":month*1,
                "sact":state, // Feed the wanted state of the device with 0 off and 1 on
                "emin":end, // end time in minutes after midnight
                "etime_opt": 0}, // End time independent of sun
                "set_overall_enable":{"enable":1}}}; // Overall enable for schedule rules
                break;
            case "delete_rule":
                command = {"smartlife.iot.common.schedule":{"delete_rule":{"id":rule_id}}};
                break;
            case "time":
                command = {"smartlife.iot.common.timesetting":{"get_time":{}}};
                break;
            case "day_use":
                command = {"smartlife.iot.common.emeter":{"get_daystat":{"year":year*1,"month":month*1}}}; 
                break;
            case "alias":
                command = {"smartlife.iot.common.system":{"set_dev_alias":{alias}}};
                break; 
        }
    }
    return command;
}

module.exports.commandGen = commandGen;

