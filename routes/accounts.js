const router = express.Router()
const accountsController = require('../controllers/accounts')

router.get('/specific/:accountId', (req, res) => {
   console.log('ROUTER HIT')
   const iAccountId = req.params.accountId
   accountsController.getSpecificAccount(iAccountId, (err, ajCustomers) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(ajCustomers)
   })
})

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

// router.get('/login/:email/:password', (req, res, next) => {
//    const jLoginForm = {
//       email: req.params.email,
//       password: req.params.password
//    }
//    accountsController.login(req, res, next, jLoginForm, (err, jResponse) => {
//       if (err) {
//          console.log(err)
//          return res.send(jResponse)
//       }
//       return res.send(jResponse)
//    })
// });

router.post('/login', (req, res, next) => {
   const jLoginForm = {
      email: req.body.email,
      password: req.body.password
   }
   console.log('jLoginForm', jLoginForm)
   accountsController.login(req, res, next, jLoginForm, (err, jResponse) => {
      if (err) {
         console.log(err)
         return res.send(jResponse)
      }
      console.log('REDIRECTING')
      return res.redirect('/accounts/auth')
      // return res.send(jResponse)
   })
});

router.get('/auth', (req, res) => {
   console.log('Inside GET /authrequired callback')
   console.log(`User authenticated? ${req.isAuthenticated()}`)
   if(req.isAuthenticated()) {
     res.send('you hit the authentication endpoint\n')
   } else {
     res.send('NOT AUTHORIZED')
   }
 })

router.get('/redirect', (req, res) => {
   return res.redirect('/accounts/redirected')
})

router.get('/redirected', (req, res) => {
   console.log('INSIDE   REDIRECTED')
   return res.send('redirected')
})

module.exports = router