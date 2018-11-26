var invoicesController = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = { status: 'success'}

invoicesController.getInvoiceById = (iInvoiceId, fCallback) => {
   aParams = [iInvoiceId];
   //sQuery = `SELECT id, fk_invoices_id, fk_customers_id, createddate, totalprice, totalpercentagediscount, remarks FROM invoices WHERE id = ?`;
   sQuery = `SELECT id, fk_customers_id, createddate, invoicenumber, totalprice, totalpercentagediscount, remarks FROM invoices WHERE id = ?`;
   db.query(sQuery, aParams, (err, ajInvoices) => {
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      console.log('SELECTED INVOICE DATA, GETTING ITEMS');
      const jInvoice = ajInvoices[0]
      const iCustomerId = jInvoice.fk_customers_id
      delete jInvoice.fk_customers_id
      // delete jInvoice.fk_invoices_id
      sQuery = `SELECT items.id, items.name, invoiceitems.units, invoiceitems.priceprunit as price
               FROM invoiceitems 
               INNER JOIN items ON invoiceitems.fk_items_id = items.id
               WHERE fk_invoices_id = ?`;
      db.query(sQuery, aParams, (err, ajItems) => {
         if(err){
            console.log('err', err)
            return fCallback(true)
         }
         console.log('SELECTED INVOICEITEMS DATA, GETTING CUSTOMER');
         jInvoice.items = ajItems;
         aParams = [iCustomerId];
         sQuery = `SELECT id, name, contactperson, cvr, street, zipcode, city, email, phone FROM customers WHERE id = ?`;
         db.query(sQuery, aParams, (err, ajCustomers) => {
            if(err){
               console.log('err', err)
               return fCallback(true)
            }
            console.log('SELECTED CUSTOMER DATA, RETURNING DATA');
            const jCustomer = ajCustomers[0]
            jInvoice.customer = jCustomer;
            return fCallback(false, jInvoice);
         })
      })
   })
}

/* invoicesController.getAccountsInvoices = (iAccountId, fCallback) => {
   ajInvoiceData = []
   ajSelectedCustomers = []
   aParams = [iAccountId];
   sQuery = `SELECT id, fk_customers_id, createddate, totalprice, totalpercentagediscount, remarks FROM invoices WHERE fk_accounts_id = ?`;
   db.query(sQuery, aParams, (err, ajInvoices) => {
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      for (let i = 0; i < ajInvoices.length; i++) {
         const jInvoice = ajInvoices[i];
         const iCustomerId = jInvoice.fk_customers_id
         delete jInvoice.fk_customers_id
         aParams = [jInvoice.id]
         sQuery = `SELECT items.id, items.name, invoiceitems.units, invoiceitems.priceprunit as price
               FROM invoiceitems 
               INNER JOIN items ON invoiceitems.fk_items_id = items.id
               WHERE fk_invoices_id = ?`;
         db.query(sQuery, aParams, (err, ajItems) => {
            if(err){
               console.log('err', err)
               return fCallback(true)
            }
            console.log('SELECTED INVOICEITEMS DATA, GETTING CUSTOMER');
            jInvoice.items = ajItems;
            aParams = [iCustomerId];
            sQuery = `SELECT id, name, contactperson, cvr, street, zipcode, city, email, phone FROM customers WHERE id = ?`;
            db.query(sQuery, aParams, (err, ajCustomers) => {
               if(err){
                  console.log('err', err)
                  return fCallback(true)
               }
               console.log('SELECTED CUSTOMER DATA, RETURNING DATA');
               const jCustomer = ajCustomers[0]
               jInvoice.customer = jCustomer;
               return fCallback(false, jInvoice);
            })
         })
         
      }
   })
} */

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
         console.log('err', err)
         return fCallback(true)
      }
      const ajPreparedInvoices = global.functions.prepareInvoiceList(ajInvoices);
      return fCallback(false, ajPreparedInvoices);
   })
}

invoicesController.createInvoice = (jInvoice, iAccountId, fCallback) => {
   let iInvoiceId
   let iTotalInvoicePrice = 0
   aParams = [iAccountId, iAccountId, iAccountId];
   sQuery = `SELECT invoices.invoicenumber, accountconfigurations.invoicenumberstartvalue, accountconfigurations.invoicenumberprefix, accountconfigurations.invoicenumberminlength FROM accounts
            INNER JOIN accountconfigurations ON accountconfigurations.fk_accounts_id = ?
            LEFT JOIN invoices ON invoices.fk_accounts_id = ? AND invoices.invoicenumber LIKE CONCAT(accountconfigurations.invoicenumberprefix, '%')
            WHERE accounts.id = ?
            ORDER BY invoices.invoicenumber DESC
            LIMIT 1`
   db.query(sQuery, aParams, (err, ajResult) => {
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      if(ajResult != undefined && ajResult.length > 0){
         const jResult = ajResult[0]
         const sInvoiceNumber = invoicesController.generateInvoiceNumber(jResult);
         aParams = [iAccountId, parseInt(jInvoice.customerId), sInvoiceNumber];
         sQuery = `INSERT INTO invoices (fk_accounts_id, fk_customers_id, invoicenumber) VALUES (?, ?, ?) `
         db.query(sQuery, aParams, (err, jResult) => {
            console.log('res', jResult)
            if(err){
               console.log('err', err)
               return fCallback(true)
            }
            iInvoiceId = jResult.insertId;
            aParams = [];
            for (let i = 0; i < jInvoice.items.length - 1; i++) {
               const item = jInvoice.items[i]
               if(item.id != ""){
                  aParams.push([iInvoiceId, item.id, item.amount, item.price])
                  iTotalInvoicePrice += (item.price * item.amount)
               }
            }
            console.log('INSERTING ITEMS', aParams);
            sQuery = `INSERT INTO invoiceitems (fk_invoices_id, fk_items_id, units, priceprunit) VALUES ?`;
            db.query(sQuery, [aParams], (err, jResult) => {
               console.log('res', jResult)
               if(err){
                  console.log('err', err)
                  return fCallback(true)
               }
               sQuery = `UPDATE invoices SET totalprice = ? WHERE id = ?`;
               aParams = [iTotalInvoicePrice, iInvoiceId];
               db.query(sQuery, aParams, (err, jResult) => {
                  console.log('res', jResult)
                  if(err){
                     console.log('err', err)
                     return fCallback(true)
                  }
               })
               return fCallback(false, iInvoiceId)
            }) 
         })
      }
   })
   aParams = [iAccountId, jInvoice.customerId]
   sQuery = `INSERT INTO invoices SET fk_accounts_id = ?, fk_customers_id = ?`;
   
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