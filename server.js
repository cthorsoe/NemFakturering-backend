global.express = require('express')
const app = express()
global.uuid = require('uuid/v4');
const cookies = require('client-sessions');
require('dotenv').config()
global.fs = require('fs')
global.path = require('path')
global.request = require('request')
const bodyParser = require("body-parser")
global.passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
global.bcrypt = require('bcrypt-nodejs');
const cors = require('cors')

const accountsRouter = require('./routes/accounts');
const invoicesRouter = require('./routes/invoices');
const customersRouter = require('./routes/customers');
const itemsRouter = require('./routes/items');

const accountsController = require('./controllers/accounts')

global.db = require('./utilities/db');
global.functions = require('./utilities/functions');

const iCookieDuration = parseInt(process.env.COOKIE_AGE);

passport.use(new LocalStrategy(
   { 
      usernameField: 'identifier',
      passwordField: 'password'
   },
   (identifier, password, done) => {
      let sField = 'username'
      if(global.jFunctions.validateEmail(identifier)){
         sField = 'email'
      }
      accountsController.getSpecificAccount(sField, identifier, true, (err, jAccount) => {
         if(err){
            return done(null, false, { message: 'An error occured when getting account from database\n' });
         }
         if (!jAccount) {
            return done(null, false, { message: 'FAILED' });
         }
         if (!bcrypt.compareSync(password, jAccount.password)) {
            return done(null, false, { message: 'FAILED' });
         }
         return done(null, jAccount);
      })
    }
 ));

app.use(cookies({
   cookieName: 'cookies',
   secret: process.env.SECRET,
   duration: iCookieDuration,
   activeDuration: iCookieDuration,
   cookie: { 
      path: '/',
      maxAge: iCookieDuration,
      ephemeral: false,
      httpOnly:true,
      secure: false
   }
}));

app.use(express.static(__dirname + '/../../public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.enable('trust proxy')

const originsWhitelist = [
   process.env.FRONTEND_URL,
];
const corsOptions = {
   origin: function(origin, callback){
         const isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
         callback(null, isWhitelisted);
   },
   credentials:true
}
app.use(cors(corsOptions))
app.use('/accounts', accountsRouter);
app.use('/invoices', invoicesRouter);
app.use('/customers', customersRouter);
app.use('/items', itemsRouter);

app.listen(3333, err => {
   if(err){
      global.functions.createError(
         '001', 
         'server.js --> app.listen() --> ERROR ESTABLISHING CONNECTION ON PORT 3333',
         'An error occured when trying to establish a connection on port 3333',
         err
      )
      return false
   }
   console.log('CONNECTION SUCCESSFULLY ESTABLISHED ON PORT 3333')
});