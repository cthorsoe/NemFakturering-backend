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
   // return res.send('OK')
   // accountsController.getSpecificAccount(iAccountId, (err, ajCustomers) => {
   //    if(err){
   //       console.log(err)
   //       return res.send(err)
   //    }
   //    return res.send(ajCustomers)
   // })
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
      identifier: req.body.identifier,
      password: req.body.password
   }
   console.log('jLoginForm', jLoginForm)
   // res.send('LOGIN HIT')
   accountsController.login(req, res, next, (err, jResponse) => {
      if (err) {
         console.log(err)
         return res.send(jResponse)
      }
      req.cookies.loginCookie = req.session.id
      return res.send(jResponse)
   })
});

router.get('/auth', (req, res) => {
   console.log('Inside GET /authrequired callback')
   // if(req.cookies && req.cookies.loginCookie){
   //    console.log('COOKIE IS', req.cookies.loginCookie)
      
   // }
   console.log(`User authenticated? ${req.isAuthenticated()}`)
   if(req.isAuthenticated()) {
      console.log(req.user);
     res.send(req.user.id.toString())
   } else {
     res.send(undefined)
   }
 })

router.get('/redirect', (req, res) => {
   return res.redirect('/accounts/redirected')
})

router.get('/redirected', (req, res) => {
   console.log('INSIDE   REDIRECTED')
   return res.send('redirected')
})

// router.get('/test', (req, res) => {
//    var strings = [];
//    var html = "";
//    for (let i = 0; i < 10; i++) {
//       const incrypted = bcrypt.hashSync('password', bcrypt.genSaltSync(process.env.ENCRYPTION_ROUNDS))
//       strings.push([incrypted, false]);
//    }
//    for (let i = 0; i < strings.length; i++) {
//       const string = strings[i];
//       string[1] = bcrypt.compareSync('password', string[0])
//       html += string[0] + ' - ' + string[1] +  ' - ' + string[0].length + '<br>'
      
//    }
//    return res.send(html);
// })

router.get('/test', (req, res) => {
   let html = '';
   const dbPw = '$2a$10$jtr7CUqnNaQb3y4D.8Uu9.X6z.ryTp/OdrAzpbxulIDT2Mq6hZYwK'
   
   html = bcrypt.compareSync('password', dbPw)
   return res.send(html);
})

module.exports = router