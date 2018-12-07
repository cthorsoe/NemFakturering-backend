const router = express.Router()
const itemsController = require('../controllers/items')

router.get('/list/:accountId', (req, res) => {
   const iAccountId = req.params.accountId
   itemsController.getAccountsItems(iAccountId, (err, ajItems) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(ajItems)
   })
})

router.post('/create', (req, res) => {
   const jItem = req.body.item
   const iAccountId = req.body.accountId
   itemsController.createItem(jItem, iAccountId, (err, jItem) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(jItem)
   })
})

router.delete('/delete/:itemId', (req, res) => {
   const iItemId = req.params.itemId
   itemsController.deleteItem(iItemId, (err, jResponse) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(jResponse)
   })
})

router.put('/edit', (req, res) => {
   const jItem = req.body
   itemsController.updateItem(jItem, (err, jItem) => {
      if(err){
         console.log(err)
         return res.send(err)
      }
      return res.send(jItem)
   })
})


module.exports = router