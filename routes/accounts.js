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



module.exports = router