var express = require('express');
const commands = require("../models/commands");
const { login } = require("tplink-cloud-api");
const { default: TPLink } = require('tplink-cloud-api/distribution/tplink');
const { default: TPLinkDevice } = require('tplink-cloud-api/distribution/device');
var router = express.Router();
const User = require("../models/user");
const Room = require("../models/room");
const Appliance = require("../models/appliance");
const Recommendation = require('../models/recommendation');


/* GET home page. */
router.get('/', async (req, res) => {
  try {
    
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  let tplink = new TPLink(sessUser.tplink.token);

  var deviceList = await tplink.getDeviceList();
  var sysInfoArray = [];

  async function asyncForEach() {
    let array = [];
    for (var index = 0; index < deviceList.length; index++) {
      let myDevice = new TPLinkDevice(tplink, deviceList[index]);

      var offline_error = null;
      let sysInfo = await myDevice.tplink_request({ "system": { "get_sysinfo": {} } }).catch((error) => {
        offline_error = error.response.data.error_code;
        if (offline_error == -20571 || offline_error == -20002 ) {
          console.log(error.response.data.error_code);
          deviceList[index].status = 0
        }
      });

      if (deviceList[index].status == 0 || myDevice == null) {
        continue; 
      }

      let time = await myDevice.tplink_request(commands.commandGen("time", deviceList[index].deviceModel.split('(')[0]));
      var hourly_usage = new Array(336).fill(0);
      var power_goals = new Array(7).fill(0);
      var cumulative_usage = new Array(336).fill(null);

      if (deviceList[index].deviceModel.split('(')[0] == "HS110") {
        var year = time.time.get_time.year;
        var month = time.time.get_time.month;
        var day = time.time.get_time.mday;
      }

      if (deviceList[index].deviceModel.split('(')[0] == "LB130") {
        var year = time['smartlife.iot.common.timesetting'].get_time.year;
        var month = time['smartlife.iot.common.timesetting'].get_time.month;
        var day = time['smartlife.iot.common.timesetting'].get_time.mday;
      }


      if (sessUser.email != null) {
        Appliance.findOne({ email: sessUser.email, oem_id: myDevice.device.deviceId }, function (err, doc) {
          if (doc == null) {
            recommendation = Recommendation({
              name: "No recommendation",
              dayArray: [0, 0, 0, 0, 0, 0, 0],
              action: [0, 0],
              times: [0, 0]
            });

            var recommendationArray = []
            recommendationArray.push(recommendation);

            appliance = Appliance({
              email: sessUser.email,
              alias: myDevice.device.alias,
              oem_id: myDevice.device.deviceId,
              hourly_usage: hourly_usage,
              cumulative_usage: cumulative_usage,
              power_goals: power_goals,
              current_day: day,
              current_month: month,
              current_year: year,
              recommendations: recommendationArray
            });
  
            appliance.save().then(result => {
            }).catch(err => {
              console.log(err);
              res.redirect('/login');
            });
          }
          else {
            doc.alias = myDevice.device.alias;
            doc.current_day = day;
            doc.current_month = month;
            doc.current_year = year;
            doc.save().then(result => {
            }).catch(err => {
              console.log(err);
              res.redirect('/login');
            });
          }
        });
        array[index] = sysInfo
      }
    }

    return array;
  }

  try {
    sysInfoArray = await asyncForEach();
  } catch (error) { }

  var roomList = await Room.find({ email: sessUser.email }).limit(2);
  var user = await User.findOne({ email: sessUser.email });

  User.findOne({ email: sessUser.email }, function (err, doc) {
    if (doc != null) {
      if (!doc.tutorial_completed) {
        doc.tutorial_completed = true;
        doc.save();
        res.redirect('/tutorial')
      } else {
        res.render('index', {
          title: 'Home',
          profilePic: user.profile_pic,
          name: user.firstname,
          deviceList: deviceList,
          roomList: roomList,
          sysInfoArray: sysInfoArray
        });
      }
    } else {
      res.redirect('/');
    }
  });
  }
  // TP link token expired
  catch(error) {
    res.redirect('/login');
  }
});

router.get('/tutorial', async (req, res) => {
  res.render('tutorial', {title: 'Welcome to LEESA'});
});

router.get('/device-instructions', async (req, res) => {
  res.render('deviceInstructions', {title: 'How to Add a Smart Device'});
});

/* GET rules page. 
router.get('/rules/:deviceID', async (req, res) => {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  sessUser.tplink = new TPLink(sessUser.tplink.token);
  let deviceList = await sessUser.tplink.getDeviceList();
  rulelist = null;

  deviceList.every(async function (device) {
    if (device.deviceId == req.params.deviceID) { 
      if (device.deviceModel.includes("HS110")) {

        let type = await sessUser.tplink.getHS100(device.alias);
        let scheduleRules = await type.tplink_request({ "schedule": { "get_rules": null } });
        let timerRules = await type.tplink_request({ "count_down": { "get_rules": null } });
        let awayRules = await type.tplink_request({ "anti_theft": { "get_rules": null } });

        let scheduleList = await scheduleRules.schedule.get_rules.rule_list;
        let timerList = await timerRules.count_down.get_rules.rule_list;
        let awayList = await awayRules.anti_theft.get_rules.rule_list;

        res.render('rules', { title: 'Express', alias: device.alias, startName: "Bedroom<br>", scheduleList: scheduleList, timerList: timerList, awayList: awayList });

      } else if (device.deviceModel.includes("LB130")) {
        let type = await sessUser.tplink.getLB130(device.alias);
        let scheduleRules = await type.tplink_request({ "schedule": { "get_rules": null } });
        let scheduleList = await scheduleRules.schedule.get_rules.rule_list;
        res.render('rules', { title: 'Express', alias: device.alias, startName: "Bedroom<br>", scheduleList: scheduleList });
      }
      return true;
    } else {
      return false;
    }
  });
});
*/

/* GET rewards page. */
router.get('/rewards', async (req, res) => {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

  let appliances = await Room.find({email: sessUser.email});

  var showRooms = true;

  if (appliances.length == 0) {
    showRooms = false;
  }

  User.findOne({ email: sessUser.email }, function (err, doc) {
    res.render('rewards', {
      title: 'Rewards', credits: doc.credits, showRooms: showRooms
    });
  });
});

/* GET rewards instructions page. */
router.get('/rewards/instructions', function (req, res, next) {
  res.render('rewardsInstructions', { title: 'How to Use Rewards' });
});

/* GET LEESAve page. */
router.get('/leesave', async (req, res) => {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  var appliances = await Appliance.find({ email: sessUser.email });
  res.render('leesave', { title: 'LEESAve', deviceList: appliances, device: appliances[0] });
});

/* GET LEESAve page. */
router.get('/leesave/:deviceID', async (req, res) => {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  var appliances = await Appliance.find({ email: sessUser.email });

  let device = null;

  for (var i = 0; i < appliances.length; i++) {
    if (req.params.deviceID == appliances[i].oem_id) {
      device = appliances[i];
    }
  }

  res.render('leesave', { title: 'LEESAve', deviceList: appliances, device: device});
});

/* GET LEESAve page. */
router.get('/leesave_history', async (req, res, next) => {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  var appliances = await Appliance.find({ email: sessUser.email });
  res.render('leesave_history', { title: 'LEESAve | History', deviceList: appliances, device: appliances[0] });
});

/* GET login page. */
router.get('/logout', function (req, res, next) {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  sessUser.tplink = null;
  sessUser.loggedIn = false;

  res.redirect('/login');
});

// Commands URL
router.post('/command', async (req, res) => {
  // Set up user and retrieve device list
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  let tplink = new TPLink(sessUser.tplink.token);
  let deviceList = await tplink.getDeviceList(); // Must device list call before any actions


  // Store alias from req sent by button
  let alias = req.body.alias; // This is sys info of the alias provided on the deviceList

  let myDeviceInfo = await tplink.findDevice(alias);
  let myDevice = new TPLinkDevice(tplink, myDeviceInfo);
  // Feed all parameters here even if it is empty as the commandGen function will deal with it.
  command = commands.commandGen(devCom = req.body.command, devModel = req.body.model.split('(')[0],
    state = req.body.state, brightness = req.body.brightness, colour = req.body.color, hue = req.body.hue,
    saturation = req.body.saturation, color_temp = req.body.color_temp, year = req.body.year, month = req.body.month,
    day = req.body.day, alias = req.body.alias, ruleName = req.body.ruleName, dayArray = req.body.dayArray, repeat = req.body.repeat,
    enable = req.body.enable, rule_id = req.body.rule_id);

  let response = await myDevice.tplink_request(command);
  // console.log(response);
  res.sendStatus(200);
});

router.post('/refresh', async (req, res) => {
  res.send(200);
});

router.get('/testdata', async (req, res) => {
  const queryAllAppliances = () => {
    //Where User is you mongoose user model
    Appliance.find({}, (err, appliances) => {
      appliances.map(appliance => {
        function randomNumber(min, max) {
          return Math.random() * (max - min) + min;
        }

        powerUsage = [];

        for (var i = 0; i < 336; i++) {
          powerUsage.push(randomNumber(0, 500));
        }

        powerGoals = new Array(7).fill(3000);

        appliance.hourly_usage = powerUsage;
        appliance.markModified('hourly_usage');
        appliance.power_goals = powerGoals;
        appliance.markModified('power_goals');
        appliance.save();
      });
    });
  }

  queryAllAppliances();

  res.redirect('/');
});

module.exports = router;

