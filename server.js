global.express = require('express')
const app = express()
global.uuid = require('uuid/v4');
// const session = require('express-session')
const cookies = require('client-sessions');
require('dotenv').config()
global.fs = require('fs')
global.path = require('path')
global.request = require('request')
// const cookieParser = require('cookie-parser')
// const FileStore = require('session-file-store')(session);
const bodyParser = require("body-parser")
global.passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
global.bcrypt = require('bcrypt-nodejs');
const cors = require('cors') // To allow requests from different domains.

const accountsRouter = require('./routes/accounts');
const invoicesRouter = require('./routes/invoices');
const customersRouter = require('./routes/customers');
const itemsRouter = require('./routes/items');

const accountsController = require('./controllers/accounts')

global.db = require('./utilities/db');
global.functions = require('./utilities/functions');

// const regexEmail = /\S+@\S+\.\S+/

const iCookieDuration = parseInt(process.env.COOKIE_AGE);


// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
   { 
      usernameField: 'identifier',    // define the parameter in req.body that passport can use as username and password
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
 
 // tell passport how to serialize the user
// passport.serializeUser((user, done) => {
//    console.log('Inside serializeUser callback. User id is save to the session file store here')
//    done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//    accountsController.getSpecificAccount('id', id, true, (err, jAccount) => {
//       if(err){
//          return done(error, false)
//       }
//       done(null, jAccount)
//    })
// });

// app.set('trust proxy', 1)
// app.use(session({
//    genid: (req) => {
//      return uuid() // use UUIDs for session IDs 
//    },
//    store: new FileStore(),
//    secret: process.env.SECRET,
//    resave: false,
//    saveUninitialized: false,
//    httpOnly: true
// }))
// app.use(passport.initialize());
// app.use(passport.session());
 

// app.use(cookies({
//    cookieName: 'cookies',
//    secret: process.env.SECRET,
//    duration: 30 * 60 * 1000,
//    activeDuration: 5 * 60 * 1000,
// }));

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
// app.use(cookieParser)
// app.use(cors({origin: 'http://localhost:4200'}));

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
// app.use(cors({origin: process.env.FRONTEND_URL}));
app.use('/accounts', accountsRouter);
app.use('/invoices', invoicesRouter);
app.use('/customers', customersRouter);
app.use('/items', itemsRouter);

app.listen(3333, err => {
   if(err){
      console.log('err')
      return false
   }
   console.log('ok')
}); 

app.get('/', (req, res) => {
   console.log('===============')
   return res.send('NEM FAKTURERING API')
})

//  