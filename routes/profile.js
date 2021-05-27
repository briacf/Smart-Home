var express = require('express');
const commands = require("../models/commands")
const { login } = require("tplink-cloud-api");
const { default: TPLink } = require('tplink-cloud-api/distribution/tplink');
const { default: TPLinkDevice } = require('tplink-cloud-api/distribution/device');
var router = express.Router();
const { CanvasRenderService } = require('chartjs-node-canvas');
const User = require("../models/user");
const Room = require("../models/room");
const Appliance = require("../models/appliance");
var path = require('path');

/* GET profile page. */
router.get('/', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    // Get the number of devices the user has
    var deviceTotal = (await Appliance.find({ email: sessUser.email })).length;

    // Get the number of rooms the user has
    var roomTotal = (await Room.find({ email: sessUser.email })).length;

    User.findOne({ email: sessUser.email }, function (err, doc) {
        res.render('profile', {
            title: 'Profile',
            firstname: doc.firstname,
            lastname: doc.lastname,
            profilePic: doc.profile_pic,
            coverPic: doc.cover_pic,
            deviceTotal: deviceTotal,
            roomTotal: roomTotal,
            deviceStateNotifs: doc.device_state_notifs,
            usageRecNotifs: doc.usage_recommendation_notifs,
        });
    });
});

// Endpoint to change user settings
router.post('/update/settings', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    const setting = req.body.setting;
    const state = req.body.state;

    if (setting == 'dev-stt-ntf') {
        User.findOne({ email: sessUser.email }, function (err, doc) {
            doc.device_state_notifs = state;
            doc.save();

            res.send(200);
        });
    } else if (setting == 'usg-rec-ntf') {
        User.findOne({ email: sessUser.email }, function (err, doc) {
            doc.usage_recommendation_notifs = state;
            doc.save();

            res.send(200);
        });
    } else {
        res.sendStatus(400);
    }
});

/* GET edit profile page page. */
router.get('/edit', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    // Get the number of devices the user has
    var deviceTotal = (await Appliance.find({ email: sessUser.email })).length;

    // Get the number of rooms the user has
    var roomTotal = (await Room.find({ email: sessUser.email })).length;

    User.findOne({ email: sessUser.email }, function (err, doc) {
        res.render('editProfile', { title: 'Profile', profile: doc });
    });
});

router.post('/edit', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    let profilePic = req.files.profilePic;
    let coverPic = req.files.coverPic;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    User.findOne({ email: sessUser.email }, function (err, doc) {
        if (doc != null) {
            var root = path.dirname(require.main.filename).replace('bin', '');

            profilePic.mv(root + '/public/img/profiles/' + doc._id + '-profile.png', function (err) {
                console.log(err);

                coverPic.mv(root + '/public/img/profiles/' + doc._id + '-cover.png', function (err) {
                    if (firstname.length > 0 && lastname.length > 0) {
                        User.findOne({ email: sessUser.email }, function (err, doc) {
                            if (doc != null) {
                                doc.firstname = firstname;
                                doc.lastname = lastname;
                                doc.profile_pic = doc.id + '-profile.png',
                                doc.cover_pic = doc.id + '-cover.png',
                                doc.save();
                            }
                        });
                    }
                });
            });
        }
    });

    res.redirect('/profile');
});

module.exports = router;