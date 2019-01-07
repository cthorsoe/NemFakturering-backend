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
            '049', 
            'controllers/invoices.js --> getInvoiceById --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to get a specific invoice',
            err
         )
         return fCallback(jError)
      }
      const jInvoice = ajInvoices[0]
      const iCustomerId = jInvoice.fk_customers_id
      delete jInvoice.fk_customers_id
      sQuery = `SELECT items.id, items.name, invoiceitems.units as amount, invoiceitems.priceprunit as price
               FROM invoiceitems 
               INNER JOIN items ON invoiceitems.fk_items_id = items.id
               WHERE fk_invoices_id = ?`;
      db.query(sQuery, aParams, (err, ajItems) => {
         if(err){
            jError = global.functions.createError(
               '051', 
               'controllers/invoices.js --> getInvoiceById --> DB QUERY ERROR',
               'An error occured when trying to run the SQL Query to get the items belonging to a specific invoice',
               err
            )
            return fCallback(jError)
         }
         jInvoice.items = ajItems;
         aParams = [iCustomerId];
         sQuery = `SELECT id, name, contactperson, cvr, street, zipcode, city, email, phone FROM customers WHERE id = ?`;
         db.query(sQuery, aParams, (err, ajCustomers) => {
            if(err){
               jError = global.functions.createError(
                  '053', 
                  'controllers/invoices.js --> getInvoiceById --> DB QUERY ERROR',
                  'An error occured when trying to run the SQL Query to get the customer attached to a specific invoice',
                  err
               )
               return fCallback(jError)
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
            '055', 
            'controllers/invoices.js --> getAccountsInvoices --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to all the invoices belonging to an account',
            err
         )
         return fCallback(jError)
      }
      const ajPreparedInvoices = global.functions.prepareInvoiceList(ajInvoices);
      return fCallback(false, ajPreparedInvoices);
   })
}

invoicesController.getInvoiceNumberData = (iAccountId, fCallback) => {
   aParams = [iAccountId, iAccountId, iAccountId];
   sQuery = `SELECT invoices.invoicenumber, accountconfigurations.invoicenumberstartvalue, accountconfigurations.invoicenumberprefix, accountconfigurations.invoicenumberminlength 
            FROM accounts
            INNER JOIN accountconfigurations ON accountconfigurations.fk_accounts_id = ?
            LEFT JOIN invoices ON invoices.fk_accounts_id = ? 
            AND ((accountconfigurations.invoicenumberprefix IS NOT NULL AND invoices.invoicenumber LIKE CONCAT(accountconfigurations.invoicenumberprefix, '%')) OR (accountconfigurations.invoicenumberprefix IS NULL) AND (invoices.invoicenumber REGEXP '^[0-9]+$'))
            WHERE accounts.id = ?
            ORDER BY invoices.invoicenumber DESC
            LIMIT 1`


            // `invoices.invoicenumber LIKE IF(accountconfigurations.invoicenumberprefix != NULL, CONCAT(accountconfigurations.invoicenumberprefix, '%'), ) `
   db.query(sQuery, aParams, (err, ajResult) => {
      if(err){
         jError = global.functions.createError(
            '057', 
            'controllers/invoices.js --> createInvoice --> DB QUERY ERROR',
            'An error occured when trying get the data used to create the invoice number for the new invoice',
            err
         )
         return fCallback(jError)
      }
      if(ajResult != undefined && ajResult.length > 0){
         const jResult = ajResult[0];
         return fCallback(false, jResult)
      }
      return fCallback(false, undefined)
   });
}

invoicesController.createInvoice = (iAccountId, jInvoice, sInvoiceNumber, fCallback) => {
   aParams = [iAccountId, parseInt(jInvoice.customerId), sInvoiceNumber];
   sQuery = `INSERT INTO invoices (fk_accounts_id, fk_customers_id, invoicenumber) VALUES (?, ?, ?) `
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            '059', 
            'controllers/invoices.js --> createInvoice --> DB QUERY ERROR',
            'An error occured when trying insert the new invoice in the database',
            err
         )
         return fCallback(jError)
      }
      return fCallback(false, jResult.insertId)
   });
}

invoicesController.updateTotalPrice = (iInvoiceId, iTotalInvoicePrice, fCallback) => {
   aParams = [iTotalInvoicePrice, iInvoiceId];
   sQuery = `UPDATE invoices SET totalprice = ? WHERE id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            '065', 
            'controllers/invoices.js --> createInvoice --> DB QUERY ERROR',
            'An error occured when running the SQL Query to update the total price of the invoice',
            err
         )
         return fCallback(jError) 
      }
      return fCallback(false, jResult)
   })
}

invoicesController.saveInvoice = (jInvoice, iAccountId, fCallback) => {
   let iTotalInvoicePrice = 0
   invoicesController.getInvoiceNumberData(iAccountId, (err, jResult) => {
      if(err){
         return fCallback(err)
      }
      console.log('INVOICE NUMBER  DATA',  jResult)
      if(jResult != undefined){
         let aItemsToInsert = [];
         let aNewItemIndexesMapping = [];
         let aInvoiceItems = [];
         const sInvoiceNumber = invoicesController.generateInvoiceNumber(jResult);
         console.log('INVOICE NUMBER IS', sInvoiceNumber)
         invoicesController.createInvoice(iAccountId, jInvoice, sInvoiceNumber, (err, iInvoiceId) => {
            if(err){
               return fCallback(err)
            }
            for (let i = 0; i < jInvoice.items.length - 1; i++) {
               let item = jInvoice.items[i]
               if(typeof(item.id) == "number"){
                  if(item.id == 0){
                     let newItem = aItemsToInsert.find(x => x == item)
                     if(newItem == null){ 
                        const aItemToInsert = [iAccountId, item.name, item.price]
                        aItemsToInsert.push(aItemToInsert);
                        aNewItemIndexesMapping.push([(aItemsToInsert.length - 1), i])
                     }
                  }
                  aInvoiceItems.push([iInvoiceId, item.id, item.amount, item.price])
                  iTotalInvoicePrice += (item.price * item.amount)
               }
            }
            if(aItemsToInsert.length > 0){
               itemsController.createMultipleItems(aItemsToInsert, (err, aItemData) => {
                  if(err){
                     return fCallback(err)
                  }
                  for (let i = 0; i < aItemData.length; i++) {
                     const aSingleItemData = aItemData[i];
                     let ajIndexMapping = aNewItemIndexesMapping.find(x => x[0] == aSingleItemData[4])
                     let item = aInvoiceItems[ajIndexMapping[1]];
                     item[1] = aSingleItemData[3];
                  }
                  invoicesController.createInvoiceItems(aInvoiceItems, err => {
                     if(err){
                        return fCallback(err)      
                     }
                     invoicesController.updateTotalPrice(iInvoiceId, iTotalInvoicePrice, (err, jResult) => {
                        if(err){
                           return fCallback(err) 
                        }
                        return fCallback(false, iInvoiceId)
                     })
                  })

               })
            }else{
               invoicesController.createInvoiceItems(aInvoiceItems, err => {
                  if(err){
                     return fCallback(err)       
                  }
                  invoicesController.updateTotalPrice(iInvoiceId, iTotalInvoicePrice, (err, jResult) => {
                     if(err){
                        return fCallback(err) 
                     }
                     return fCallback(false, iInvoiceId)
                  })
               })
            }
         });
      }
   })
}

invoicesController.createInvoiceItems = (aItemValues, fCallback) => {
   console.log('aItemValues', aItemValues)
   aParams = aItemValues;
   sQuery = `INSERT INTO invoiceitems (fk_invoices_id, fk_items_id, units, priceprunit) VALUES ?`;
   db.query(sQuery, [aParams], (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            '071', 
            'controllers/invoices.js --> createInvoiceItems --> DB QUERY ERROR',
            'An error occured when creating invoice items to a new invoice',
            err
         )
         return fCallback(jError)
      }
      return fCallback(false)
   }) 
}

invoicesController.generateInvoiceNumber = (jInvoiceNumberData) =>{
   let sInvoiceNumber = '';
   if(jInvoiceNumberData.invoicenumber == null){
      if(jInvoiceNumberData.invoicenumberprefix != null) {
         sInvoiceNumber += jInvoiceNumberData.invoicenumberprefix;
      }
      const sStartVal = jInvoiceNumberData.invoicenumberstartvalue.toString()
      if(jInvoiceNumberData.invoicenumberminlength <= sStartVal.length){
         sInvoiceNumber += sStartVal
      }else{
         sInvoiceNumber += "0".repeat((jInvoiceNumberData.invoicenumberminlength - sStartVal.length))
         sInvoiceNumber += sStartVal
      }
   }else{
      let sIdentifier = '';
      if(jInvoiceNumberData.invoicenumberprefix != null){
         sInvoiceNumber += jInvoiceNumberData.invoicenumberprefix
         sIdentifier = (parseInt(jInvoiceNumberData.invoicenumber.split(jInvoiceNumberData.invoicenumberprefix)[1]) + 1).toString()
      }else{
         sIdentifier = (parseInt(jInvoiceNumberData.invoicenumber) + 1).toString();
      }
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