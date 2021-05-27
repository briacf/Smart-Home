const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const profileRouter = require('./routes/profile');
const Appliance = require("./models/appliance");
const Cryptr = require('cryptr');
const User = require('./models/user');
const { default: TPLink } = require('tplink-cloud-api');
const { commandGen } = require('./models/commands');
const cryptr = new Cryptr('gazoz');
const { login } = require("tplink-cloud-api");
const { default: TPLinkDevice } = require('tplink-cloud-api/distribution/device');
const commands = require("./models/commands")
const loginObjects = require("./login_objects")

// Create Mongoose Client
mongoose.connect('mongodb://localhost:27017/deco3801-nonpc', { useNewUrlParser: true, useUnifiedTopology: true });

const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/deco3801-nonpc',
  collection: 'sessions'
});

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

powerUsage = []

for (var i = 0; i < 336; i++) {
  powerUsage.push(randomNumber(0, 15));
}

async function getPowerUsage() {
  await new Promise(r => setTimeout(r, 10000));
  var usage_count = -1;
  var appliances = await Appliance.find({});

  while (true) {

    appliances.map(appliance => {

      if (appliance != null) {

        User.find({ email: appliance.email }, async (err, appUser) => {

          if (appUser != null) {
            var parsedLoginObject = JSON.parse(JSON.stringify(loginObjects));
            userPassword = cryptr.decrypt(appUser[0].password);
            let tplink = new TPLink(parsedLoginObject.loginObjects[appliance.email].token, parsedLoginObject.loginObjects[appliance.email].termid) // create tplink
            let deviceList = await tplink.getDeviceList(); // retrieve deviceList

            // Grab the right info the current appliance from deviceList
            var deviceInfo;
            for (var i = 0; i < deviceList.length; i++) {
              if (deviceList[i].deviceId == appliance.oem_id) {
                deviceInfo = deviceList[i];
              }
            }

            let device = new TPLinkDevice(tplink, deviceInfo); // Setup the new device
            let time = await device.tplink_request(commands.commandGen("time", deviceInfo.deviceModel.split('(')[0])); // Retrieve the current device time

            if (deviceInfo.deviceModel.split('(')[0] == "HS110") {
              var year = time.time.get_time.year;
              var month = time.time.get_time.month;
              var day = time.time.get_time.mday;
              var dayUsage = await device.tplink_request(commands.commandGen("day_use", deviceInfo.deviceModel.split('(')[0],
                null, null, null, null, null, null, year, month, day)); //Generate the current device usage for this hour on provided time (day, month, year)
              var day_usage = dayUsage.emeter.get_daystat.day_list[dayUsage.emeter.get_daystat.day_list.length - 1];
            }

            if (deviceInfo.deviceModel.split('(')[0] == "LB130") {
              var year = time['smartlife.iot.common.timesetting'].get_time.year;
              var month = time['smartlife.iot.common.timesetting'].get_time.month;
              var day = time['smartlife.iot.common.timesetting'].get_time.mday;
              var dayUsage = await device.tplink_request(commands.commandGen("day_use", deviceInfo.deviceModel.split('(')[0],
                null, null, null, null, null, null, year, month, day)); //Generate the current device usage for this hour on provided time (day, month, year)
              var day_usage = dayUsage['smartlife.iot.common.emeter'].get_daystat.day_list[dayUsage['smartlife.iot.common.emeter'].get_daystat.day_list.length - 1];
            }

            appliance.cumulative_usage[usage_count] = day_usage.energy_wh;

            if (usage_count != 0) {
              appliance.hourly_usage[usage_count] = appliance.cumulative_usage[usage_count] - appliance.cumulative_usage[usage_count - 1];
              console.log("Hours since registered", usage_count);
              console.log("For device: ", appliance.alias, "\nCumulative Power Since Registered", appliance.cumulative_usage[usage_count], "Last hour power usage", appliance.hourly_usage[usage_count])
            }
            appliance.hours_passed = usage_count;
            appliance.markModified('power_goals');
            appliance.markModified('hourly_usage');
            appliance.markModified('cumulative_usage');
            appliance.save();

          }
        });
      }

      else {
        return;
      }

    });

    //await new Promise(r => setTimeout(r, 600000));

    usage_count = usage_count + 1;
    await new Promise(r => setTimeout(r, 3600000));
  }
}

getPowerUsage();