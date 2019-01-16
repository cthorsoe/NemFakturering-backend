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

router.get('/logo/:accountId', (req, res) => {
   console.log('ROUTER HIT')
   const iAccountId = req.params.accountId
   accountsController.getAccountLogo(iAccountId, (err, imgAvatar) => {
      res.writeHead(200, {'Content-Type': 'image/jpeg' });
      return res.end(imgAvatar, 'binary');
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
         delete jAccount.emailverified
         return res.send(jAccount)
      })
   }else if(sUsername != undefined){
      accountsController.getSpecificAccount('username', sUsername, true, (err, jAccount) => {
         if(err){
            console.log(err)
            return res.send(err)
         }
         delete jAccount.emailverified
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

router.post('/activate', (req, res) => {
   let iAccountId = req.body.accountId
   let jPaymentData = req.body.paymentData
   // res.send('LOGIN HIT')
   accountsController.recievePaymentAndActivate(iAccountId, jPaymentData, (err, jResponse) => {
      if (err) {
         return res.send(err)
      }
      return res.send({status:'SUCCESS'})
   })
});

router.post('/subscribe', (req, res) => {
   const iAccountId = req.body.accountId
   const jPaymentData = req.body.paymentData
   accountsController.saveStripeSubscription(iAccountId, jPaymentData, (err, jSubscription) => {
      if (err) {
         return res.send(err)
      }
      return res.send(jSubscription)
   })
});

router.get('/subscription/:accountId', (req, res) => {
   const iAccountId = req.params.accountId
   accountsController.getSubscription(iAccountId, (err, jSubscription) => {
      if (err) {
         return res.send(err)
      }
      return res.send(jSubscription)
   })
});

router.post('/cancel-subscription', (req, res) => {
   const iAccountId = req.body.accountId
   accountsController.cancelStripeSubscription(iAccountId, (err, jSubscription) => {
      if (err) {
         return res.send(err)
      }
      return res.send(jSubscription)
   })
});

router.post('/reactivate-subscription', (req, res) => {
   const iAccountId = req.body.accountId
   accountsController.reactivateStripeSubscription(iAccountId, (err, jSubscription) => {
      if (err) {
         return res.send(err)
      }
      return res.send(jSubscription)
   })
});

router.get('/verify/:verificationId', (req, res) => {
   const sVerificationId = req.params.verificationId
   accountsController.verifyAccount(sVerificationId, (err, sStatus) => {
      if(err){
         return res.send('AN ERROR OCCURED. VERIFICATION DID NOT GO THROUGH. TRY AGAIN LATER.')
      }
      if(sStatus == 'SUCCESS'){
         return res.redirect(process.env.FRONTEND_URL)
      }else if (sStatus == 'NOMATCH'){
         return res.send('AN ERROR OCCURED. VERIFICATION LINK NOT VALID.')
      }
   })
})

router.post('/clear-session', (req, res) => {
   console.log('COOKIES IS', req.cookies)
   if(!req.cookies && req.cookies.sessionkey != undefined){
      console.log('NO COOKIES')
      return res.send({ status:'SUCCESS'})
   }
   accountsController.clearSession(req.cookies.sessionkey, req.cookies.sessionvalue, (err) => {
      if(err){
         console.log('GOT ERROR')
         return res.send({ status:'ERROR'})
      }
      req.cookies.sessionkey = undefined;
      req.cookies.sessionvalue = undefined;
      return res.send({ status:'SUCCESS'})
   })
})

module.exports = router