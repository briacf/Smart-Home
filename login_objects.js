const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const Appliance = require("./models/appliance");
const Cryptr = require('cryptr');
const User = require('./models/user');
const { default: tplink } = require('tplink-cloud-api');
const { commandGen } = require('./models/commands');
const cryptr = new Cryptr('gazoz');
const { login } = require("tplink-cloud-api");
const { default: TPLinkDevice } = require('tplink-cloud-api/distribution/device');
const commands = require("./models/commands");

// Create Mongoose Client
mongoose.connect('mongodb://localhost:27017/deco3801-nonpc', { useNewUrlParser: true, useUnifiedTopology: true });

var loginObjects = {};

async function addUser(user) {
  let userPassword = cryptr.decrypt(user.password);
  let tplink = await login(user.email, userPassword);

  loginObjects[user.email] = tplink;
}

async function createLoginObjects() {
  User.find({}, (err, users) => {
    users.map(user => {
      addUser(user);
    })
  });
}

createLoginObjects();

module.exports.loginObjects = loginObjects;
