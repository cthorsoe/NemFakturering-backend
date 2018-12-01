const router = express.Router()
const customersController = require('../controllers/customers')

router.get('/list/:accountId', (req, res) => {
   const iAccountId = req.params.accountId
   customersController.getAccountsCustomers(iAccountId, (err, ajCustomers) => {
      if (err) {
         console.log(err)
         return res.send(err)
      }
      return res.send(ajCustomers)
   })
})

router.delete('/delete/:customerId', (req, res) => {
   const iCustomerId = req.params.customerId
   customersController.deleteCustomer(iCustomerId, (err, jResponse) => {
      if (err) {
         console.log(err)
         return res.send(err)
      }
      return res.send(jResponse)
   })
})

router.put('/edit', (req, res) => {
   const jCustomer = req.body
   customersController.updateCustomer(jCustomer, (err, jResponse) => {
      if (err) {
         console.log(err)
         return res.send(err)
      }
      return res.send(jResponse)
   })
});

router.post('/create', (req, res) => {
   const jCustomer = req.body.customer
   const iAccountId = req.body.accountId
   customersController.createCustomer(jCustomer, iAccountId, (err, jResponse) => {
      if (err) {
         console.log(err)
         return res.send(err)
      }
      return res.send(jResponse)
   })
});


module.exports = router