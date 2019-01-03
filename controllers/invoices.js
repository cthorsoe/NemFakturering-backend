var invoicesController = {}
const itemsController = require('./items')
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = { status: 'success'}

invoicesController.getInvoiceById = (iInvoiceId, fCallback) => {
   aParams = [iInvoiceId];
   sQuery = `SELECT id, fk_customers_id, createddate, invoicenumber, totalprice, totalpercentagediscount, remarks FROM invoices WHERE id = ?`;
   db.query(sQuery, aParams, (err, ajInvoices) => {
      if(err){
         jError = global.functions.createError(
            '047', 
            'controllers/invoices.js --> getInvoiceById --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to get a specific invoice',
            err
         )
         return fCallback(true, jError)
      }
      const jInvoice = ajInvoices[0]
      const iCustomerId = jInvoice.fk_customers_id
      delete jInvoice.fk_customers_id
      sQuery = `SELECT items.id, items.name, invoiceitems.units, invoiceitems.priceprunit as price
               FROM invoiceitems 
               INNER JOIN items ON invoiceitems.fk_items_id = items.id
               WHERE fk_invoices_id = ?`;
      db.query(sQuery, aParams, (err, ajItems) => {
         if(err){
            jError = global.functions.createError(
               '049', 
               'controllers/invoices.js --> getInvoiceById --> DB QUERY ERROR',
               'An error occured when trying to run the SQL Query to get the items belonging to a specific invoice',
               err
            )
            return fCallback(true, jError)
         }
         jInvoice.items = ajItems;
         aParams = [iCustomerId];
         sQuery = `SELECT id, name, contactperson, cvr, street, zipcode, city, email, phone FROM customers WHERE id = ?`;
         db.query(sQuery, aParams, (err, ajCustomers) => {
            if(err){
               jError = global.functions.createError(
                  '051', 
                  'controllers/invoices.js --> getInvoiceById --> DB QUERY ERROR',
                  'An error occured when trying to run the SQL Query to get the customer attached to a specific invoice',
                  err
               )
               return fCallback(true, jError)
            }
            console.log('SELECTED CUSTOMER DATA, RETURNING DATA');
            const jCustomer = ajCustomers[0]
            jInvoice.customer = jCustomer;
            return fCallback(false, jInvoice);
         })
      })
   })
}

invoicesController.getAccountsInvoices = (iAccountId, fCallback) => {
   ajInvoiceData = []
   ajSelectedCustomers = []
   aParams = [iAccountId];
   sQuery = `SELECT invoices.id as invoiceId, invoices.invoicenumber, invoices.createddate, invoices.totalprice, invoices.totalpercentagediscount, invoices.remarks, items.id as itemId, items.name as itemName, invoiceitems.units, invoiceitems.priceprunit, customers.id as customerId, customers.name as customerName, customers.contactperson, customers.cvr, customers.street, customers.zipcode, customers.city, customers.email, customers.phone
            FROM invoiceitems 
            INNER JOIN invoices ON invoiceitems.fk_invoices_id = invoices.id
            INNER JOIN items ON invoiceitems.fk_items_id = items.id
            INNER JOIN customers ON invoices.fk_customers_id = customers.id
            WHERE invoices.fk_accounts_id = ?
            ORDER BY invoices.createddate`;
   db.query(sQuery, aParams, (err, ajInvoices) => {
      if(err){
         jError = global.functions.createError(
            '053', 
            'controllers/invoices.js --> getAccountsInvoices --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to all the invoices belonging to an account',
            err
         )
         return fCallback(true, jError)
      }
      const ajPreparedInvoices = global.functions.prepareInvoiceList(ajInvoices);
      return fCallback(false, ajPreparedInvoices);
   })
}

invoicesController.createInvoice = (jInvoice, iAccountId, fCallback) => {
   let iInvoiceId
   let iTotalInvoicePrice = 0
   aParams = [iAccountId, iAccountId, iAccountId];
   sQuery = `SELECT invoices.invoicenumber, accountconfigurations.invoicenumberstartvalue, accountconfigurations.invoicenumberprefix, accountconfigurations.invoicenumberminlength 
            FROM accounts
            INNER JOIN accountconfigurations ON accountconfigurations.fk_accounts_id = ?
            LEFT JOIN invoices ON invoices.fk_accounts_id = ? AND invoices.invoicenumber LIKE CONCAT(accountconfigurations.invoicenumberprefix, '%')
            WHERE accounts.id = ?
            ORDER BY invoices.invoicenumber DESC
            LIMIT 1`
   db.query(sQuery, aParams, (err, ajResult) => {
      if(err){
         jError = global.functions.createError(
            '055', 
            'controllers/invoices.js --> createInvoice --> DB QUERY ERROR',
            'An error occured when trying get the data used to create the invoice number for the new invoice',
            err
         )
         return fCallback(true, jError)
      }
      if(ajResult != undefined && ajResult.length > 0){
         let ajItemsToInsert = [];
         let ajNewItemIndexesMapping = [];
         let aInvoiceItems = [];
         const jResult = ajResult[0]
         const sInvoiceNumber = invoicesController.generateInvoiceNumber(jResult);
         aParams = [iAccountId, parseInt(jInvoice.customerId), sInvoiceNumber];
         sQuery = `INSERT INTO invoices (fk_accounts_id, fk_customers_id, invoicenumber) VALUES (?, ?, ?) `
         db.query(sQuery, aParams, (err, jResult) => {
            if(err){
               jError = global.functions.createError(
                  '057', 
                  'controllers/invoices.js --> createInvoice --> DB QUERY ERROR',
                  'An error occured when trying insert the new invoice in the database',
                  err
               )
               return fCallback(true, jError)
            }
            iInvoiceId = jResult.insertId;
            for (let i = 0; i < jInvoice.items.length - 1; i++) {
               let item = jInvoice.items[i]
               if(typeof(item.id) == "number"){
                  if(item.id == 0){
                     let newItem = ajItemsToInsert.find(x => x == item)
                     if(newItem == null){    
                        const ajItemToInsert = {
                           fk_accounts_id:iAccountId,
                           name: item.name,
                           defaultprice:item.price
                        }
                        ajItemsToInsert.push(ajItemToInsert);
                        ajNewItemIndexesMapping.push([(ajItemsToInsert.length - 1), i])
                     }
                  }
                  aInvoiceItems.push([iInvoiceId, item.id, item.amount, item.price])
                  iTotalInvoicePrice += (item.price * item.amount)
               }
            }
            if(ajItemsToInsert.length > 0){
               itemsController.createMultipleItems(ajItemsToInsert, (err, ajInsertData) => {
                  if(err){
                     jError = global.functions.createError(
                        '059', 
                        'controllers/invoices.js --> createInvoice --> createMultipleItems() ERROR',
                        'An error occured when running the createMultipleItems() to create all unknown items added to this invoice',
                        err
                     )
                     return fCallback(true, jError)
                  }
                  for (let i = 0; i < ajInsertData.length; i++) {
                     const jInsertData = ajInsertData[i];
                     let ajIndexMapping = ajNewItemIndexesMapping.find(x => x[0] == jInsertData.index)
                     let item = aInvoiceItems[ajIndexMapping[1]];
                     item[1] = jInsertData.id;
                  }
                  invoicesController.createInvoiceItems(aInvoiceItems, err => {
                     if(err){
                        jError = global.functions.createError(
                           '061', 
                           'controllers/invoices.js --> createInvoice --> createInvoiceItems() ERROR',
                           'An error occured when running the createInvoiceItems() to create all items belonging to the invoice, after creating unknown items',
                           err
                        )
                        return fCallback(true, jError)      
                     }
                     aParams = [iTotalInvoicePrice, iInvoiceId];
                     sQuery = `UPDATE invoices SET totalprice = ? WHERE id = ?`;
                     db.query(sQuery, aParams, (err, jResult) => {
                        if(err){
                           jError = global.functions.createError(
                              '063', 
                              'controllers/invoices.js --> createInvoice --> DB QUERY ERROR',
                              'An error occured when running the SQL Query to update the total price of the invoice, after creating unknown items',
                              err
                           )
                           return fCallback(true, jError) 
                        }
                        return fCallback(false, iInvoiceId)
                     })
                  })

               })
            }else{
               invoicesController.createInvoiceItems(aInvoiceItems, err => {
                  if(err){
                     jError = global.functions.createError(
                        '065', 
                        'controllers/invoices.js --> createInvoice --> createInvoiceItems() ERROR',
                        'An error occured when running the createInvoiceItems() to create all items belonging to the invoice, without creating unknown items',
                        err
                     )
                     return fCallback(true, jError)       
                  }
                  aParams = [iTotalInvoicePrice, iInvoiceId];
                  sQuery = `UPDATE invoices SET totalprice = ? WHERE id = ?`;
                  db.query(sQuery, aParams, (err, jResult) => {
                     console.log('res', jResult)
                     if(err){
                        jError = global.functions.createError(
                           '067', 
                           'controllers/invoices.js --> createInvoice --> DB QUERY ERROR',
                           'An error occured when running the SQL Query to update the total price of the invoice, without creating unknown items',
                           err
                        )
                        return fCallback(true, jError) 
                     }
                     return fCallback(false, iInvoiceId)
                  })
               })
            }
         })
      }
   })
}

invoicesController.createInvoiceItems = (aItemValues, fCallback) => {
   aParams = aItemValues;
   sQuery = `INSERT INTO invoiceitems (fk_invoices_id, fk_items_id, units, priceprunit) VALUES ?`;
   db.query(sQuery, [aParams], (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            '069', 
            'controllers/invoices.js --> createInvoiceItems --> DB QUERY ERROR',
            'An error occured when creating invoice items to a new invoice',
            err
         )
         return fCallback(true, jError)
      }
      return fCallback(false)
   }) 
}

invoicesController.generateInvoiceNumber = (jInvoiceNumberData) =>{
   let sInvoiceNumber = '';
   if(jInvoiceNumberData.invoicenumber == null){
      sInvoiceNumber += jInvoiceNumberData.invoicenumberprefix;
      const sStartVal = jInvoiceNumberData.invoicenumberstartvalue.toString()
      if(jInvoiceNumberData.invoicenumberminlength <= sStartVal.length){
         sInvoiceNumber += sStartVal
      }else{
         sInvoiceNumber += "0".repeat((jInvoiceNumberData.invoicenumberminlength - sStartVal.length))
         sInvoiceNumber += sStartVal
      }
   }else{
      sInvoiceNumber += jInvoiceNumberData.invoicenumberprefix
      console.log(jInvoiceNumberData.invoicenumber, jInvoiceNumberData.invoicenumberprefix, parseInt(jInvoiceNumberData.invoicenumber.split(jInvoiceNumberData.invoicenumberprefix)[1]))
      const sIdentifier = (parseInt(jInvoiceNumberData.invoicenumber.split(jInvoiceNumberData.invoicenumberprefix)[1]) + 1).toString()
      if(jInvoiceNumberData.invoicenumberminlength <= sIdentifier.length){
         sInvoiceNumber += sIdentifier
      }else{
         sInvoiceNumber += "0".repeat((jInvoiceNumberData.invoicenumberminlength - sIdentifier.length))
         sInvoiceNumber += sIdentifier
      }
   }
   return sInvoiceNumber
}

module.exports = invoicesController