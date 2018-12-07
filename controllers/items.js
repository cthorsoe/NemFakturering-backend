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

itemsContoller.createItem = (jItem, iAccountId, fCallback) => {
   let jPostedItem = Object.assign({}, jItem);
   jItem.fk_accounts_id = iAccountId;
   aParams = [jItem];
   sQuery = `INSERT INTO items SET ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      console.log('res', jResult)
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      
      jPostedItem.id = jResult.insertId
      return fCallback(false, jPostedItem)
   }) 
}

itemsContoller.deleteItem = (iItemId, fCallback) => {
   aParams = [iItemId]
   sQuery = `UPDATE items
            SET deleted = 1
            WHERE id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      console.log('res', jResult)
      if(err){
         console.log('err', err)
          return fCallback(true)
      }
      var jResponse = {
         deleted: jResult.affectedRows == 1
      }
      return fCallback(false, jResponse)
  })
}

itemsContoller.updateItem = (jItem, fCallback) => {
   aParams = [jItem, jItem.id];
   sQuery = `UPDATE items
            SET ?
            WHERE id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      console.log('res', jResult)
      if(err){
         console.log('err', err)
            return fCallback(true)
      }
      return fCallback(false, jItem)
   })
}

itemsContoller.createMultipleItems = (aItemData, fCallback) => {
   
   for (let i = 0; i < aItemData.length; i++) {
      const aItem = aItemData[i];
      let ajInsertData = []
      aParams = [aItem];
      sQuery = `INSERT INTO items SET ?`;
      db.query(sQuery, aParams, (err, jResult) => {
         if(err){
            console.log('err', err)
            return fCallback(true)
         }
         const jInsertData = {
            id: jResult.insertId,
            index: i
         }
         ajInsertData.push(jInsertData)
         if(ajInsertData.length == aItemData.length){
            return fCallback(false, ajInsertData)
         }
      }) 
   }
   /* aParams = [aItemData];
   sQuery = `INSERT INTO items (fk_accounts_id, name, defaultprice) VALUES ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      console.log('res', jResult)
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      return fCallback(false, jResult)
   })  */
}

module.exports = itemsContoller