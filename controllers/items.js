var itemsContoller = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = { status: 'success'}


itemsContoller.getAccountsItems = (iAccountId, fCallback) => {
   console.log('CONTROLLER HIT')
   aParams = [false, iAccountId]
   sQuery = `SELECT id, name, defaultprice
            FROM items 
            WHERE deleted = ? AND fk_accounts_id = ?`;
   db.query(sQuery, aParams, (err, ajItems) => {
      if(err){
          console.log('err', err)
          return fCallback(true)
      }
      return fCallback(false, ajItems)
  }) 
}

// itemsContoller.searchItems = (iAccountId, sSearchQuery, fCallback) => {
//    console.log('CONTROLLER HIT')
//    aParams = [iAccountId, '%' + sSearchQuery + '%']
//    sQuery = `SELECT * 
//             FROM items 
//             WHERE deleted = false AND fk_accounts_id = ? AND name LIKE ?`;
//    db.query(sQuery, aParams, (err, ajItems) => {
//       if(err){
//           console.log('err', err)
//           return fCallback(true)
//       }
//       return fCallback(false, ajItems)
//    }) 
// }


module.exports = itemsContoller