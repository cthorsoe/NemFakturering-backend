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


// router.get('/search/:accountId/:query', (req, res) => {
//    const iAccountId = req.params.accountId
//    const sSearchQuery = req.params.query.toLowerCase()
//    console.log('HIT', iAccountId, sSearchQuery);
//    itemsController.searchItems(iAccountId, sSearchQuery, (err, ajItems) => {
//       if(err){
//          console.log(err)
//          return res.send(err)
//       }
//       return res.send(ajItems)
//    })
// })


module.exports = router