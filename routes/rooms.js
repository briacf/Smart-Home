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

/* GET rooms page. */
router.get('/', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    // Get all the user's rooms
    var roomList = await Room.find({ email: sessUser.email }).sort({'device_oem_ids': 'desc'});

    res.render('rooms', { title: 'Rooms', roomList: roomList, recent: false });
});

router.get('/recent', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    // Get all the user's rooms
    var roomList = await Room.find({ email: sessUser.email }).sort({'date_added': 'desc'})

    res.render('rooms', { title: 'Rooms', roomList: roomList, recent: true });
});

/* GET rooms page. */
router.get('/add', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
    let tplink = new TPLink(sessUser.tplink.token);
    let deviceList = await tplink.getDeviceList();

    res.render('addRoom', { title: 'Add New Room', deviceList: deviceList, endpoint: 'Add' });
});

// Add a new room to db
router.post('/add', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
    
    let roomName = req.body.roomName;
    let roomColor = req.body.roomColor;

    // Get devices user wants to add to the room
    let tplink = new TPLink(sessUser.tplink.token);
    let deviceList = await tplink.getDeviceList();
    var addedDevices = [];

    for (var i = 0; i < deviceList.length; i++) {
        const device = deviceList[i];

        if (req.body[device.alias + 'Value'] == 'true') {
            addedDevices.push(device.deviceId);
        }
    }

    var room = new Room({
        email: sessUser.email,
        name: roomName,
        color: roomColor,
        date_added: Date.now(),
        device_oem_ids: addedDevices,
        last_accessed: Date.now()
    });

    room.save(function (err, room) {
        if (err) return console.error(err);
    });

    res.redirect('/rooms');
});

/* GET room details page. */
router.get('/:roomName', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    Room.findOne({ email: sessUser.email, name: req.params.roomName }, async function (err, room) {
        room.last_accessed = Date.now();
        room.save();

        var roomDeviceOemIDs = room.device_oem_ids;
        var roomDevices = [];
    
        let tplink = new TPLink(sessUser.tplink.token);
        let deviceList = await tplink.getDeviceList();
    
        for (var i = 0; i < deviceList.length; i++) {
            const device = deviceList[i];
    
            if (roomDeviceOemIDs.includes(device.deviceId)) {
                roomDevices.push(device);
            }
        }
    
        res.render('roomDetails', { title: 'Rooms', roomName: req.params.roomName, deviceList: roomDevices });
    });
});

/* Removing a Room from the Rooms */
router.get('/delete/:roomName', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;

    Room.deleteOne({ email: sessUser.email, name: req.params.roomName }, function (err) {
    });

    res.redirect('/rooms');
});

/* GET edit room page. */
router.get('/edit/:roomName', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
    let tplink = new TPLink(sessUser.tplink.token);
    let deviceList = await tplink.getDeviceList();

    Room.findOne({ email: sessUser.email, name: req.params.roomName }, function (err, doc) {
        if (doc != null) {
            var roomDeviceOemIDs = doc.device_oem_ids;
            res.render('addRoom', { title: 'Edit Room', deviceList: deviceList, endpoint: 'Edit', roomName: req.params.roomName, roomDeviceOemIDs: roomDeviceOemIDs });
        } else {
            res.redirect('/rooms');
        }
    });
});

// Edit room in db
router.post('/edit/:roomName', async (req, res) => {
    let sessUser = (typeof req.session.user !== 'undefined') ? req.session.user : false;
    
    let roomName = req.body.roomName;
    let roomColor = req.body.roomColor;

    // Get devices user wants to add to the room
    let tplink = new TPLink(sessUser.tplink.token);
    let deviceList = await tplink.getDeviceList();
    var addedDevices = [];

    for (var i = 0; i < deviceList.length; i++) {
        const device = deviceList[i];

        if (req.body[device.alias + 'Value'] == 'true') {
            addedDevices.push(device.deviceId);
        }
    }

    Room.findOne({ email: sessUser.email, name: req.params.roomName }, function (err, doc) {
        doc.name = roomName;
        doc.device_oem_ids = addedDevices;
        doc.color = roomColor;
        doc.save();
    });

    console.log(roomName);

    res.redirect('/rooms/' + roomName);
});

module.exports = router;