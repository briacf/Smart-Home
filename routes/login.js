var express = require('express');
const commands = require("../models/commands")
const powerGoals = require("../models/power_goals")
const { login } = require("tplink-cloud-api");
const { default: TPLink } = require('tplink-cloud-api/distribution/tplink');
const { default: TPLinkDevice } = require('tplink-cloud-api/distribution/device');
var router = express.Router();
const { CanvasRenderService } = require('chartjs-node-canvas');
const User = require("../models/user");
const Room = require("../models/room");
const Appliance = require("../models/appliance");
const Cryptr = require('cryptr');
const { typePowerGoals } = require('../models/power_goals');
const Recommendation = require('../models/recommendation');
const cryptr = new Cryptr('gazoz');
var path = require('path');

/* GET login page. */
router.get('/', function (req, res, next) {
  res.render('login', { title: 'Login to LEESA', errors: "" });
});

router.get('/register', function (req, res, next) {
  res.render('register', { title: 'Create an Account', errors: "" });
});

router.post('/register', async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  var cpassword = req.body.cpassword;

  console.log(email);
  console.log(password);


  if (password != cpassword) {
    res.render('register', { title: 'Create an Account', errors: "Passwords don't match" });
  } else {
    var root = path.dirname(require.main.filename).replace('bin', '');
    const spawn = require("child_process").spawn;
    const pythonProcess = spawn('python', [root + "webdriver/kasaregister.py", email, password]);

    pythonProcess.stdout.on('data', (data) => {
      data = data.toString()

      if (data == 'success' || data.includes('Register OK')) {
        res.redirect('https://deco3801-non-pc.uqcloud.net/login/success');
      } else {
        data = data.charAt(0).toUpperCase() + data.slice(1);
        res.render('register', { title: 'Create an Account', errors: data });
      }
    });
  }
});

router.get('/success', function (req, res) {
  res.render('success', { title: 'Account Created' });
});

async function saveAppliances(tplink, email) {
  let deviceList = await tplink.getDeviceList();
  // Check if the user is missing any devices, if so
  // add them to the db
  const dataBaseLoading = async function asyncForEach(array) {
    for (let index = 0; index < deviceList.length; index++) {
      let myDevice = new TPLinkDevice(tplink, deviceList[index]);
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

      Appliance.findOne({ email: email, oem_id: deviceList[index].deviceId, alias: deviceList[index].alias}, function (err, doc) {
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
            email: email,
            alias: deviceList[index].alias,
            oem_id: deviceList[index].deviceId,
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
          doc.alias = deviceList[index].alias;
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
    }
  }

  dataBaseLoading();
}

/* Login to TPLink with credentials */
router.post('/', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const tplink = await login(email, password);
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
    sessUser.email = email;
    sessUser.tplink = tplink;
    sessUser.loggedIn = true;

    // check which devices are already in the db
    // add devices not in the db to mongo
    User.findOne({ email: email }, async (err, doc) => {
      if (doc == null) {
        const encryptedPassword = cryptr.encrypt(password);
        user = User({
          email: email,
          password: encryptedPassword,
        });

        user.save().then(result => {
          saveAppliances(tplink, email).then(result => {
            // Redirect to collect user's name
            res.redirect('/login/details/' + user._id);
          });
        }).catch(err => {
          console.log(err);
          res.redirect('/login');
        });
      } else {
        saveAppliances(tplink, email);
        res.redirect('/');
      }
    });
  }

  catch (error) {
    // Login failed
    console.log(error);
    res.render('login', { title: 'Express', errors: "Incorrect email or password" });
  }
});

/* GET details page. */
router.get('/details/:id', function (req, res, next) {
  res.render('details', { title: 'Express', id: req.params.id });
});

router.post('/details/:id', async (req, res) => {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  sessUser.tplink = new TPLink(sessUser.tplink.token);

  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let id = req.params.id;

  User.findOne({ _id: id }, function (err, doc) {
    doc.firstname = firstname;
    doc.lastname = lastname;
    doc.save();
  });

  let deviceList = await sessUser.tplink.getDeviceList();

  if (deviceList.length > 0) {
    res.redirect('/login/deviceTypes');
  } else {
    res.redirect('/');
  }
});

/* GET details page. */
router.get('/deviceTypes', async (req, res) => {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  sessUser.tplink = new TPLink(sessUser.tplink.token);

  let deviceList = await sessUser.tplink.getDeviceList();
  let undefinedDeviceList = await Appliance.find({ email: sessUser.email, type: "undefined" });
  let devices = [];

  for (undefinedDevice in undefinedDeviceList) {
    for (device in deviceList) {
      if (undefinedDevice.deviceId == device.deviceId) {
        devices.push(device);
      }
    }
  }

  res.render('deviceTypes', { title: 'Express', id: req.params.id, deviceList: deviceList });
});

router.post('/deviceTypes', async (req, res) => {
  let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
  sessUser.tplink = new TPLink(sessUser.tplink.token);

  let email = "";
  let deviceList = await sessUser.tplink.getDeviceList();


  const queryAllAppliances = () => {
    //Where User is you mongoose user model
    Appliance.find({}, (err, appliances) => {
      appliances.map(appliance => {
        for (var index = 0; index < deviceList.length; index++) {
          if (deviceList[index].deviceId == appliance.oem_id) {
            let type = req.body[deviceList[index].alias + 'Value'];

            appliance.type = type;

            appliance.power_goals = new Array(7).fill(powerGoals.typePowerGoals[type]);
            appliance.markModified('power_goals');

            appliance.save();
          }
        }
      })
    });

    res.redirect('/');
  }

  queryAllAppliances();
});

module.exports = router;
module.exports.saveAppliances = saveAppliances;
