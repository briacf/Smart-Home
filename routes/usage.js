var express = require('express');
const commands = require("../models/commands")
const { default: TPLink } = require('tplink-cloud-api/distribution/tplink');
const { default: TPLinkDevice } = require('tplink-cloud-api/distribution/device');
var router = express.Router();
const Room = require("../models/room");
const Appliance = require("../models/appliance");
const User = require("../models/user");

/* GET usage page. */
router.get('/:deviceID', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    Appliance.findOne({ email: sessUser.email, oem_id: req.params.deviceID }, (err, doc) => {
        if (doc != null) {
            res.render('usage', { title: 'Power Usage', alias: doc.alias, oemID: doc.oem_id, type: doc.type, startName: "", source: '/' });
        } else {
            res.sendStatus(404);
        }
    });
});

router.get('/rewards/:deviceID', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    Appliance.findOne({ email: sessUser.email, oem_id: req.params.deviceID }, (err, doc) => {
        if (doc != null) {
            res.render('usage', { title: 'Power Usage', alias: doc.alias, oemID: doc.oem_id, type: doc.type, startName: "", source: '/rewards' });
        } else {
            res.sendStatus(404);
        }
    });
});

function getTypeName(type) {
    var typeName = type;
    if (typeName == 'tv') {
        typeName = 'TV';
    } else if (typeName == 'small-appliance') {
        typeName = 'Small Appliance';
    } else {
        typeName = type.charAt(0).toUpperCase() + type.slice(1);
    }
    return typeName;
}

router.get('/edit/:deviceID', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    Appliance.findOne({ email: sessUser.email, oem_id: req.params.deviceID }, (err, doc) => {
        if (doc != null) {
            res.render('editDevice', {
                title: 'Power Usage',
                alias: doc.alias,
                oemID: doc.oem_id,
                type: doc.type,
                typeName: getTypeName(doc.type),
                startName: ""
            });
        } else {
            res.sendStatus(404);
        }
    });
});

router.post('/edit/:deviceID', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    let newAlias = req.body.alias;
    let newDeviceType = '';

    Appliance.findOne({ email: sessUser.email, oem_id: req.params.deviceID }, async (err, doc) => {
        if (doc != null) {
            newDeviceType = req.body[doc.alias + '-value'];

            if (doc.alias != newAlias) {
                let tplink = new TPLink(sessUser.tplink.token);
                let deviceList = await tplink.getDeviceList(); // retrieve deviceList

                // Grab the right info the current appliance from deviceList
                var deviceInfo;
                for (var i = 0; i < deviceList.length; i++) {
                    if (deviceList[i].oemId == req.params.deviceID && deviceList[i].alias == doc.alias) {
                        deviceInfo = deviceList[i];
                    }
                }
                let device = new TPLinkDevice(tplink, deviceInfo);

                //doc.alias = newAlias
                //doc.save();
            }

            if (newDeviceType != "undefined") {
                doc.type = newDeviceType;
                doc.save();
            }

            res.redirect('/usage/' + req.params.deviceID)
        } else {
            res.sendStatus(401);
        }
    });
});

router.post('/delete/:deviceID', async (req, res) => {
    res.redirect('/');
});

function rotate(array, times) {
    while (times--) {
        var temp = array.shift();
        array.push(temp)
    }

    return array;
}

// Endpoint to get graph data
router.post('/graph', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    var oemID = req.body.deviceID;
    var kind = req.body.kind;

    var week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    if (oemID != null && ["today", "week"].includes(kind)) {
        var now = new Date();
        var xAxisLabels = [];

        if (oemID == "all") {
            var weekLimit = now.getDay();

            if (weekLimit == 0) {
                weekLimit = 8;
            }

            xAxisLabels = week.slice(0, weekLimit);
            xAxisLabels[xAxisLabels.length - 1] = "Today";

            let hourlyUsage = await getAllPowerUsage(sessUser.email, "week");
            let powerGoals = await getAllPowerGoals(sessUser.email, "week");

            res.send([xAxisLabels, hourlyUsage, powerGoals]);
        } else {
            if (kind == "today") {
                xAxisLabels = new Array(12);
                let currentHour = now.getHours();

                for (i = 11; i >= 0; i--) {
                    if (currentHour > 11) {
                        if (currentHour == 12) {
                            xAxisLabels[i] = currentHour + " PM";
                        } else {
                            xAxisLabels[i] = (currentHour - 12) + " PM";
                        }
                    } else {
                        xAxisLabels[i] = currentHour + " AM";
                    }

                    if (currentHour == 0) {
                        currentHour = 23;
                    } else {
                        currentHour -= 1;
                    }
                }
       
                xAxisLabels[11] = "Now";
                //console.log(req.body.alias);
                // Get hourly usage today for this device
                Appliance.findOne({ oem_id: oemID }, (err, doc) => {
  
                    // Get last 24 values from hourly usage array
                    var hourlyUsage = doc.hourly_usage;
                    hourlyUsage = hourlyUsage.slice(Math.max(hourlyUsage.length - 13, 0));

                    var powerGoals = new Array(12).fill(doc.power_goals[6] / 2);

                    res.send([xAxisLabels, hourlyUsage, powerGoals]);
                });
            } else if (kind == "week") {
                xAxisLabels = rotate(week, now.getDay());
                xAxisLabels[6] = "Today";

                // Get hourly usage this week for this device
                Appliance.findOne({ oem_id: oemID }, (err, doc) => {
                    // Get last 168 values from hourly usage array
                    var hourlyUsage = doc.hourly_usage;
                    hourlyUsage = hourlyUsage.slice(Math.max(hourlyUsage.length - 169, 1));

                    var data = new Array(7).fill(0);

                    var day = 24;
                    var dailyUsage = 0;
                    var weekDay = 0;
                    for (var i = 0; i < 169; i++) {
                        dailyUsage += hourlyUsage[i];

                        if (day == 0) {
                            day = 24;
                            data[weekDay] += Math.round(dailyUsage);
                            dailyUsage = 0;
                            weekDay += 1;
                        }

                        day -= 1;
                    }

                    res.send([xAxisLabels, data, doc.power_goals]);
                });
            }
        }
    } else {
        res.sendStatus(400);
    }
});

router.post('/least-efficient', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    var leastEfficient = await leastEfficientDevices(sessUser.email);

    console.log(leastEfficient[1]);

    User.findOne({ email: sessUser.email }, function (err, doc) {
        res.send({
            leDevices: leastEfficient[0],
            leGoals: leastEfficient[1],
            leUsage: leastEfficient[2]
        });
    });
});

// Endpoint to get graph data
router.post('/room-graph', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    let rooms = await Room.find({ email: sessUser.email });
    let xLabels = [];
    let data = [];
    let colors = [];

    for (var i = 0; i < rooms.length; i++) {
        xLabels.push(rooms[i].name);

        let power = await getRoomPowerUsage(rooms[i]);
        data.push(power);

        if (rooms[i].color == "orange") {
            colors.push('#f67203');
        } else if (rooms[i].color == "green") {
            colors.push('#327c5e');
        } else if (rooms[i].color == "purple") {
            colors.push('#7757a8');
        } else if (rooms[i].color == "blue") {
            colors.push('#3b55ce');
        } else if (rooms[i].color == "red") {
            colors.push('#ff3131');
        }
    }

    
    res.send([xLabels, data, colors]);
});

// Returns an array with first index being total (cumulative) power use and second index being live power use
async function getDevicePowerUse(tplink, device) {
    if (device.deviceModel.includes('LB130')) {
        let myDevice = await tplink.getLB130(device.deviceId);
        let powerUsage = await myDevice.tplink_request({ "smartlife.iot.common.emeter": { "get_daystat": { "year": 2020, "month": 9 } } });

        return ([powerUsage["smartlife.iot.common.emeter"].get_daystat.day_list[0].energy_wh, -1]);
    }

    else if (device.deviceModel.includes('HS110')) {
        let myDevice = await tplink.getHS110(device.deviceId);
        let powerUsage = await myDevice.tplink_request({ "emeter": { "get_realtime": {} } });

        return ([devicePowerUse.push(powerUsage.emeter.get_realtime.total_wh),
        deviceLivePowerUse.push(powerUsage.emeter.get_realtime.power_mw / 1000)]);
    }
}

// Live update UI off plug
router.post('/update', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
    let tplink = new TPLink(sessUser.tplink.token);
    let deviceList = await tplink.getDeviceList();
    let devicePowerUse = [];
    let deviceLivePowerUse = [];

    try {
        for (var i = 0; i < deviceList.length; i++) {
            const deviceInfo = deviceList[i];

            let device = new TPLinkDevice(tplink, deviceInfo);
            let time = await device.tplink_request(commands.commandGen("time", deviceInfo.deviceModel.split('(')[0])); // Retrieve the current device time

            if (deviceInfo.deviceModel.split('(')[0] == "HS110") {
                var year = time.time.get_time.year;
                var month = time.time.get_time.month;
                var day = time.time.get_time.mday;

                var dayUsage = await device.tplink_request(commands.commandGen("day_use", deviceInfo.deviceModel.split('(')[0],
                    null, null, null, null, null, null, year, month, day)); //Generate the current device usage for this hour on provided time (day, month, year)
                var day_usage = dayUsage.emeter.get_daystat.day_list[dayUsage.emeter.get_daystat.day_list.length - 1];

                var realTime = await device.tplink_request(commands.commandGen("realtime", deviceInfo.deviceModel.split('(')[0],
                    null, null, null, null, null, null, null, null, null)); //Generate the current device usage for this hour on provided time (day, month, year)
                var real_time = (realTime.emeter.get_realtime.power_mw / 1000).toFixed(1);

                devicePowerUse.push(day_usage.energy_wh);
                deviceLivePowerUse.push(real_time);
            } else if (deviceInfo.deviceModel.split('(')[0] == "LB130") {
                var year = time['smartlife.iot.common.timesetting'].get_time.year;
                var month = time['smartlife.iot.common.timesetting'].get_time.month;
                var day = time['smartlife.iot.common.timesetting'].get_time.mday;
                var dayUsage = await device.tplink_request(commands.commandGen("day_use", deviceInfo.deviceModel.split('(')[0],
                    null, null, null, null, null, null, year, month, day)); //Generate the current device usage for this hour on provided time (day, month, year)
                var day_usage = dayUsage['smartlife.iot.common.emeter'].get_daystat.day_list[dayUsage['smartlife.iot.common.emeter'].get_daystat.day_list.length - 1];

                devicePowerUse.push(day_usage.energy_wh);
                deviceLivePowerUse.push(-1);
            } else {
                devicePowerUse.push(-1);
                deviceLivePowerUse.push(-1);
            }
        }
    } catch (error) {
        console.log(error)
    }

    let totalPowerUsage = await getAllPowerUsage(sessUser.email, "day");
    let totalPowerGoals = await getAllPowerGoals(sessUser.email, "day");

    res.send([devicePowerUse, deviceLivePowerUse,
        totalPowerUsage[3], totalPowerUsage[2], totalPowerUsage[1], totalPowerUsage[0],
        totalPowerGoals]);
});

// Live update device
router.post('/update/device', async (req, res) => {
    const oemId = req.body.deviceId;

    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
    let tplink = new TPLink(sessUser.tplink.token);
    let deviceList = await tplink.getDeviceList();

    let found = false;

    for (device in deviceList) {
        // Device is in this room
        if (device.deviceId == oemId) {
            // Add this devices' power usage to room totals
            let devicePowerUse = await getDevicePowerUse(tplink, device);
            res.send(devicePowerUse);
        }
    }

    // Device with given oem id not found
    if (!found) {
        res.sendStatus(401);
    }
});

// Live update all rooms
router.post('/update-rooms', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
    let tplink = new TPLink(sessUser.tplink.token);
    let deviceList = await tplink.getDeviceList();

    let rooms = await Room.find({ email: sessUser.email });
    let roomPowerData = [];

    for (var i = 0; i < rooms.length; i++) {
        roomPowerData.push(rooms[i].name);
        let power = await getRoomLivePowerUsage(tplink, deviceList, rooms[i]);
        roomPowerData.push(power);
    }

    res.send(roomPowerData);
});

async function getRoomLivePowerUsage(tplink, deviceList, room) {
    let deviceOemIds = room.device_oem_ids;
    let totalPowerUsage = 0;

    for (var i = 0; i < deviceOemIds.length; i++) {
        let oemId = deviceOemIds[i];

        for (var j = 0; j < deviceList.length; j++) {
            let deviceInfo = deviceList[j];

            if (deviceInfo.deviceId == oemId) {
                let device = new TPLinkDevice(tplink, deviceInfo);
                let time = await device.tplink_request(commands.commandGen("time", deviceInfo.deviceModel.split('(')[0])); // Retrieve the current device time

                if (deviceInfo.deviceModel.split('(')[0] == "HS110") {
                    var year = time.time.get_time.year;
                    var month = time.time.get_time.month;
                    var day = time.time.get_time.mday;

                    var dayUsage = await device.tplink_request(commands.commandGen("day_use", deviceInfo.deviceModel.split('(')[0],
                        null, null, null, null, null, null, year, month, day)); //Generate the current device usage for this hour on provided time (day, month, year)
                    var day_usage = dayUsage.emeter.get_daystat.day_list[dayUsage.emeter.get_daystat.day_list.length - 1];

                    var realTime = await device.tplink_request(commands.commandGen("realtime", deviceInfo.deviceModel.split('(')[0],
                        null, null, null, null, null, null, null, null, null)); //Generate the current device usage for this hour on provided time (day, month, year)
                    var real_time = (realTime.emeter.get_realtime.power_mw / 1000).toFixed(1);

                    totalPowerUsage += day_usage.energy_wh;
                } else if (deviceInfo.deviceModel.split('(')[0] == "LB130") {
                    var year = time['smartlife.iot.common.timesetting'].get_time.year;
                    var month = time['smartlife.iot.common.timesetting'].get_time.month;
                    var day = time['smartlife.iot.common.timesetting'].get_time.mday;
                    var dayUsage = await device.tplink_request(commands.commandGen("day_use", deviceInfo.deviceModel.split('(')[0],
                        null, null, null, null, null, null, year, month, day)); //Generate the current device usage for this hour on provided time (day, month, year)
                    var day_usage = dayUsage['smartlife.iot.common.emeter'].get_daystat.day_list[dayUsage['smartlife.iot.common.emeter'].get_daystat.day_list.length - 1];

                    totalPowerUsage += day_usage.energy_wh;
                } else {
                    devicePowerUse.push(-1);
                    deviceLivePowerUse.push(-1);
                }
            }
        }
    }

    return totalPowerUsage;
}


async function getRoomPowerUsage(room) {
    let deviceOemIds = room.device_oem_ids;
    var totalPowerUsage = 0;

    for (var i = 0; i < deviceOemIds.length; i++) {
        await Appliance.findOne({ oem_id: deviceOemIds[i] }, async (err, appliance) => {
            if (appliance != null) {
                var hourlyUsage = appliance.hourly_usage;
                hourlyUsage = hourlyUsage.slice(Math.max(hourlyUsage.length - 169, 0));

                var data = new Array(7).fill(0);

                var day = 24;
                var dailyUsage = 0;
                var weekDay = 0;
                for (var i = 0; i < 169; i++) {
                    dailyUsage += hourlyUsage[i];

                    if (day == 0) {
                        day = 24;
                        data[weekDay] += Math.round(dailyUsage);
                        dailyUsage = 0;
                        weekDay += 1;
                    }

                    day -= 1;
                }

                var now = new Date();
                var weekLimit = now.getDay();
                weekLimit = 7 - weekLimit;

                for (var i = weekLimit; i < 7; i++) {
                    totalPowerUsage += data[i];
                }
            }
        });
    }

    return totalPowerUsage;
}

// Get power usage for all devices, either today or this week
// Used to show bar graph on home page and graph on rewards page
//
// If kind = day, returns an in array of len 3 representing the last 3 days
// If kind = week, returns an array of len 7 representing total power for each day of the week
async function getAllPowerUsage(email, kind) {
    let appliances = await Appliance.find({ email: email });

    var data;

    if (kind == "day") {
        data = new Array(4).fill(0);
    } else if (kind == "week") {
        data = new Array(7).fill(0);
    }

    appliances.map(appliance => {
        if (kind == "day") {
            var hourlyUsage = appliance.hourly_usage;
            hourlyUsage = hourlyUsage.slice(Math.max(hourlyUsage.length - 97, 0));

            var day = 24;
            var dailyUsage = 0;
            var weekDay = 0;
            for (var i = 0; i < 97; i++) {
                dailyUsage += hourlyUsage[i];

                if (day == 0) {
                    day = 24;
                    data[weekDay] += Math.round(dailyUsage);
                    dailyUsage = 0;
                    weekDay += 1;
                }

                day -= 1;
            }
        } else if (kind == "week") {
            var hourlyUsage = appliance.hourly_usage;
            hourlyUsage = hourlyUsage.slice(Math.max(hourlyUsage.length - 169, 0));

            var day = 24;
            var dailyUsage = 0;
            var weekDay = 0;
            for (var i = 0; i < 169; i++) {
                dailyUsage += hourlyUsage[i];

                if (day == 0) {
                    day = 24;
                    data[weekDay] += Math.round(dailyUsage);
                    dailyUsage = 0;
                    weekDay += 1;
                }

                day -= 1;
            }
        }
    });

    return data;
}

// Get power goals for all devices, either today or this week
// Used to show bar graph on home page and graph on rewards page
//
// If kind = day, returns an int representing total power goals for the day
// If kind = week, returns an array of len 7 representing total goals for each day of the week
async function getAllPowerGoals(email, kind) {
    let appliances = await Appliance.find({ email: email });

    var value = 0;
    var data = new Array(7).fill(0);

    appliances.map(appliance => {
        if (kind == "day") {
            if (appliance.power_goals[6] == null) {
                value += 0;
            } else {
                value += appliance.power_goals[6];
            }
        } else if (kind == "week") {
            var powerGoals = appliance.power_goals;

            for (var i = 0; i < 7; i++) {
                data[i] += Math.round(powerGoals[i]);
                dailyGoal = 0;
            }
        }
    });

    if (kind == "day") {
        return value;
    } else if (kind == "week") {
        return data;
    } else {
        return undefined;
    }
}

// Returns the (max 3) least efficient devices for the current week
// Compares avg. use to avg. power goal
// If no devices have avg. use > avg. goal, returns empty array
//
async function leastEfficientDevices(email) {
    let appliances = await Appliance.find({});
    var devices = [];
    var percents = [];
    var powerUsage = [];
    var powerGoals = [];

    for (var j = 0; j < appliances.length; j++) {
        let appliance = appliances[j];

        var totalPowerGoal = 0;
        var devicePowerGoals = appliance.power_goals;

        for (var i = 0; i < devicePowerGoals.length; i++) {
            totalPowerGoal += devicePowerGoals[i];
        }

        totalPowerGoal = totalPowerGoal / 7;

        var totalUsage = 0;
        var hourlyUsage = appliance.hourly_usage;
        hourlyUsage = hourlyUsage.slice(Math.max(hourlyUsage.length - 169, 0));

        for (var i = 0; i < 169; i++) {
            totalUsage += hourlyUsage[i];
        }

        totalUsage = totalUsage / 24 / 7;

        if (totalUsage > totalPowerGoal) {
            percent = totalPowerGoal / totalUsage;

            if (percents.length == 3) {
                var i;
                for (i = 0; i < percents.length; i++) {
                    if (percent > percents[i]) {
                        percents[i] = percent;
                        devices[i] = appliance;
                        powerGoals[i] = totalPowerGoal;
                        powerUsage[i] = totalUsage;
                    }
                }
            } else {
                percents.push(percent);
                devices.push(appliance);
                powerGoals.push(totalPowerGoal);
                powerUsage.push(totalUsage);
            }
        }
    }

    return [devices, powerGoals, powerUsage];
}

module.exports = router;