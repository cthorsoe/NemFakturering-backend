var itemsContoller = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = { status: 'success'}


itemsContoller.getAccountsItems = (iAccountId, fCallback) => {
   aParams = [false, iAccountId]
   sQuery = `SELECT id, name, defaultprice
            FROM items 
            WHERE deleted = ? AND fk_accounts_id = ?`;
   db.query(sQuery, aParams, (err, ajItems) => {
      if(err){
         jError = global.functions.createError(
            '071', 
            'controllers/items.js --> getAccountsItems --> DB QUERY ERROR',
            'An error occured when running the SQL Query to get all items belonging to a specific account',
            err
         )
         return fCallback(true, jError)
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
      if(err){
         jError = global.functions.createError(
            '073', 
            'controllers/items.js --> createItem --> DB QUERY ERROR',
            'An error occured when running the SQL Query to create a new item',
            err
         )
         return fCallback(true, jError)
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
      if(err){
         jError = global.functions.createError(
            '075', 
            'controllers/items.js --> deleteItem --> DB QUERY ERROR',
            'An error occured when running the SQL Query to mark an item as deleted',
            err
         )
         return fCallback(true, jError)
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
      if(err){
         jError = global.functions.createError(
            '077', 
            'controllers/items.js --> updateItem --> DB QUERY ERROR',
            'An error occured when running the SQL Query to update an existing item',
            err
         )
         return fCallback(true, jError)
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
            jError = global.functions.createError(
               '079', 
               'controllers/items.js --> createMultipleItems --> DB QUERY ERROR',
               'An error occured when running the SQL Query to bulk insert multiple items',
               err
            )
            return fCallback(true, jError)
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
}

module.exports = itemsContoller