global.express = require('express')
const app = express()
const uuid = require('uuid/v4');
require('dotenv').config()
global.fs = require('fs')
global.path = require('path')
global.request = require('request')
const bodyParser = require("body-parser")
// const cookieParser = require('cookie-parser')
const session = require('express-session')
const FileStore = require('session-file-store')(session);
global.passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const axios = require('axios');
const cors = require('cors') // To allow requests from different domains.

const accountsRouter = require('./routes/accounts');
const invoicesRouter = require('./routes/invoices');
const customersRouter = require('./routes/customers');
const itemsRouter = require('./routes/items');

global.db = require('./utilities/db');
global.functions = require('./utilities/functions');

global.sSmsesIoApiToken = "$2y$10$fkMJCdFng8vkbpVD2h1OcuWGMuUCIk2SWfe62JvtXZtqhtiqvmPw6";

const users = [
   {id: '2f24vvg', email: 'test@test.com', password: 'password'}
]

// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
   { usernameField: 'email' },
   (email, password, done) => {
      axios.get(`http://localhost:5000/users?email=${email}`)
      .then(res => {
        const user = res.data[0]
        if (!user) {
          return done(null, false, { message: 'Invalid credentials.\n' });
        }
        if (password != user.password) {
          return done(null, false, { message: 'Invalid credentials.\n' });
        }
        return done(null, user);
      })
      .catch(error => done(error));
    }
 ));
 
 // tell passport how to serialize the user
passport.serializeUser((user, done) => {
   console.log('Inside serializeUser callback. User id is save to the session file store here')
   done(null, user.id);
});

passport.deserializeUser((id, done) => {
   axios.get(`http://localhost:5000/users/${id}`)
      .then(res => done(null, res.data) )
      .catch(error => done(error, false))
});

app.set('trust proxy', 1)
app.use(session({
   genid: (req) => {
     return uuid() // use UUIDs for session IDs
   },
   store: new FileStore(),
   secret: process.env.SECRET,
   resave: false,
   saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());
 
app.use(express.static(__dirname + '/../../public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(cors({origin: 'http://localhost:4200'}));
app.use(cors())
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
   console.log(req.session.id)
   return res.send('NEM FAKTURERING API')
})