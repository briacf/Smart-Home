const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const usageRouter = require('./routes/usage');
const roomsRouter = require('./routes/rooms');
const profileRouter = require('./routes/profile');
const TPCloudAPI = require('tplink-cloud-api');
const fileUpload = require('express-fileupload');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const port = 8081;

app.set('trust proxy', 'loopback');

// Create Mongoose Client
mongoose.connect('mongodb://localhost:27017/deco3801-nonpc', { useNewUrlParser: true, useUnifiedTopology: true });

const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/deco3801-nonpc',
  collection: 'sessions'
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.use(session({
  secret: 'middlewareSecret',
  resave: true,
  saveUninitialized: true,
  unset: 'destroy',
  name: 'SessionCookie',
  store: store
}));

// set up user sessions
app.get('*', function (req, res, next) {
  app.locals.user = req.user || null;
  if (!req.session.user) {
    req.session.user = {
      email: "",
      loggedIn: false,
      tplink: null,
      deviceList: null
    };
  }
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', 'loopback');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) { // Catches access to all other pages
  if (req.url != '/login') {
    if (req.url == '/login/register' || req.url == '/login/success') {
      next();
    } else {
      if (!req.session.user.loggedIn) {
        res.redirect('/login');
      } else {
        next();
      }
    }
  } else {
    next();
  }
});

app.use(fileUpload());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/usage', usageRouter);
app.use('/rooms', roomsRouter);
app.use('/profile', profileRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const server = app.listen(port, () => {
  console.log(`LEESA is live on port ${server.address().port}`);
});

require('./login_objects.js');
require('./background_usage');

module.exports = app;
