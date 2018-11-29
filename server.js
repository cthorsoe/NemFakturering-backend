//TEST!!
global.express = require('express')
const app = express()
require('dotenv').config()
const session = require('express-session')
global.fs = require('fs')
global.path = require('path')
global.request = require('request')
const bodyParser = require("body-parser")
const cors = require('cors') // To allow requests from different domains.

const accountsRouter = require('./routes/accounts');
const invoicesRouter = require('./routes/invoices');
const customersRouter = require('./routes/customers');
const itemsRouter = require('./routes/items');

global.db = require('./utilities/db');
global.functions = require('./utilities/functions');

global.sSmsesIoApiToken = "$2y$10$fkMJCdFng8vkbpVD2h1OcuWGMuUCIk2SWfe62JvtXZtqhtiqvmPw6";

// app.use(session({
//     secret: 'your secret',
//     name: 'name of session id',
//     resave: true,
//     saveUninitialized: true}));

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
   return res.send('NEM FAKTURERING API')
})