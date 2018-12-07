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
          console.log('err', err)
          return fCallback(true)
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

customersController.updateCustomer = (jCustomer, fCallback) => {
   aParams = [jCustomer.name, jCustomer.contactperson, jCustomer.cvr, jCustomer.street, jCustomer.zipcode, jCustomer.city, jCustomer.email, jCustomer.phone, jCustomer.id];
   sQuery = `UPDATE customers
            SET name = ?, contactperson = ?, cvr = ?, street = ?, zipcode = ?, city = ?, email = ?, phone = ?
            WHERE id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      console.log('res', jResult)
      if(err){
         console.log('err', err)
            return fCallback(true)
      }
      return fCallback(false, jCustomer)
   }) 
}

customersController.createCustomer = (jCustomer, iAccountId, fCallback) => {
   let jPostedCustomer = Object.assign({}, jCustomer);
   jCustomer.fk_accounts_id = iAccountId;
   aParams = [jCustomer];
   sQuery = `INSERT INTO customers SET ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      console.log('res', jResult)
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      jPostedCustomer.id = jResult.insertId
      return fCallback(false, jPostedCustomer)
   }) 
}


module.exports = customersController