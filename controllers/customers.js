var customersController = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = { status: 'success'}

customersController.getAccountsCustomers = (iAccountId, fCallback) => {
   console.log('CONTROLLER HIT')
   aParams = [false, iAccountId]
   sQuery = `SELECT id, name, contactperson, email, phone, cvr, street, zipcode, city 
            FROM customers 
            WHERE deleted = ? AND fk_accounts_id = ?`;
   db.query(sQuery, aParams, (err, ajCustomers) => {
      if(err){
         jError = global.functions.createError(
            '041', 
            'controllers/customers.js --> getAccountsCustomers --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to get the customers beloning to a specific account',
            err
         )
         return fCallback(jError)
      }
      return fCallback(false, ajCustomers)
  }) 
}

customersController.deleteCustomer = (iCustomerId, fCallback) => {
   aParams = [iCustomerId]
   sQuery = `UPDATE customers
            SET deleted = 1
            WHERE id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            '043', 
            'controllers/customers.js --> deleteCustomer --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to mark a specific customer as deleted',
            err
         )
         return fCallback(jError)
      }
      var jResponse = {
         deleted: jResult.affectedRows == 1
      }
      return fCallback(false, jResponse)
  }) 
}

customersController.updateCustomer = (jCustomer, fCallback) => {
   aParams = [jCustomer.name, jCustomer.contactperson, jCustomer.cvr, jCustomer.street, jCustomer.zipcode, jCustomer.city, jCustomer.email, jCustomer.phone, jCustomer.id];
   sQuery = `UPDATE customers
            SET name = ?, contactperson = ?, cvr = ?, street = ?, zipcode = ?, city = ?, email = ?, phone = ?
            WHERE id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            '045', 
            'controllers/customers.js --> updateCustomer --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to update a specific customer',
            err
         )
         return fCallback(jError)
      }
      return fCallback(false, jCustomer)
   }) 
}

customersController.createCustomer = (jCustomer, iAccountId, fCallback) => {
   let jPostedCustomer = Object.assign({}, jCustomer);
   jCustomer.fk_accounts_id = iAccountId;
   console.log('INSERTING CUSTOMER', jCustomer)
   aParams = [jCustomer];
   sQuery = `INSERT INTO customers SET ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         console.log('')
         jError = global.functions.createError(
            '047', 
            'controllers/customers.js --> createCustomer --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to create a new customer',
            err
         )
         return fCallback(jError)
      }
      jPostedCustomer.id = jResult.insertId
      return fCallback(false, jPostedCustomer)
   }) 
}


module.exports = customersController