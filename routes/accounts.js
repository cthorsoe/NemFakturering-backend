const router = express.Router()
const accountsController = require('../controllers/accounts')

router.post('/create', (req, res) => {
   const jAccount = req.body
   accountsController.createAccount(jAccount, (err, jResponse) => {
      if (err) {
         console.log(err)
         return res.send(jResponse)
      }
      return res.send(jResponse)
   })
});

router.get('/specific/:accountId', (req, res) => {
   console.log('ROUTER HIT')
   const iAccountId = req.params.accountId
   accountsController.getSpecificAccount('id', iAccountId, false, (err, jAccount) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(jAccount)
   })
})

router.get('/specific', (req, res) => {
   console.log('ROUTER HIT')
   const sEmail = req.query.email
   const sUsername = req.query.username
   console.log(sEmail, sUsername)
   if(sEmail != undefined){
      accountsController.getSpecificAccount('email', sEmail, true, (err, jAccount) => {
         if(err){
            console.log(err)
            return res.send(err)
         }
         return res.send(jAccount)
      })
   }else if(sUsername != undefined){
      accountsController.getSpecificAccount('username', sUsername, true, (err, jAccount) => {
         if(err){
            console.log(err)
            return res.send(err)
         }
         return res.send(jAccount)
      })
   }else{
      return res.send('ERROR: NO PARAMS')
   }
})

router.put('/update-configuration', (req, res) => {
   const jAccount = req.body
   accountsController.updateAccountAndConfiguration(jAccount, (err, jAccount) => {
      if(err){
         console.log(err)
         return res.send('ERROR');
      }
      return res.send(jAccount);
   });
});

router.get('/stats/:accountId', (req, res) => {
   console.log('ROUTER HIT')
   const iAccountId = req.params.accountId
   accountsController.getAccountStats(iAccountId, (err, ajCustomers) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(ajCustomers)
   })
})

router.post('/login', (req, res, next) => {
   const jLoginForm = {
      identifier: req.body.identifier,
      password: req.body.password
   }
   console.log('jLoginForm', jLoginForm)
   // res.send('LOGIN HIT')
   accountsController.login(req, jLoginForm, (err, jResponse) => {
      if (err) {
         console.log(err)
         return res.send(jResponse)
      }
      console.log(req.cookies);
      return res.send(jResponse)
   })
});

router.get('/auth', (req, res) => {
   if(!req.cookies && req.cookies.sessionkey != undefined){
      console.log('NO COOKIES')
      return res.send('undefined')
   }
   let sSessionKey = req.cookies.sessionkey;
   let sSessionValue = req.cookies.sessionvalue;
   console.log('COOKIES', req.cookies)
   accountsController.getSessionData(sSessionKey, (err, jSessionData) => {
      if(err){
         return res.send('undefined')
      }
      bcrypt.hash(jSessionData.fk_accounts_id, jSessionData.sessionsalt, undefined, (err, incrypted) => {
      if(err){
         console.log('ERR HASHING')
         return res.send('undefined')
      }
      if(incrypted == sSessionValue){
         accountsController.getSpecificAccount('id', jSessionData.fk_accounts_id, false, (err, jAccount) => {
            if(err){
               return res.send('undefined')
            }
            return res.send(jAccount)
         })
      }
      });
   })
})

module.exports = router