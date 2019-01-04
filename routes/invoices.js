const router = express.Router()
const invoicesController = require('../controllers/invoices')

router.get('/specific/:invoiceId', (req, res) => {
   const iInvoiceId = req.params.invoiceId
   invoicesController.getInvoiceById(iInvoiceId, (err, jInvoice) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(jInvoice)
   })
})

router.get('/list/:accountId', (req, res) => {
   const iAccountId = req.params.accountId
   invoicesController.getAccountsInvoices(iAccountId, (err, ajInvoices) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(ajInvoices)
   })
})

router.post('/save', (req, res) => {
   const iAccountId = req.body.accountId
   const jInvoice = req.body.invoice
   console.log('SAVING INVOICE', iAccountId, jInvoice)
   invoicesController.saveInvoice(jInvoice, iAccountId, (err, iInvoiceId) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      invoicesController.getInvoiceById(iInvoiceId, (err, jInvoice) => {
         if(err){
            console.log(err)
            return res.send(err)
         }
         return res.send(jInvoice)
      })
   })
});

module.exports = router