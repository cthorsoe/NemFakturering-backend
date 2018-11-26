var accountsController = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = { status: 'success'}

// accountsController.getSpecificAccount = (iAccountId, fCallback) => {
//    aParams = [iAccountId]
//    sQuery = `SELECT accounts.id, accounts.name, accounts.cvr, accounts.street, accounts.zipcode, accounts.city, accounts.email, accounts.phone, accountconfigurations.bankaccountnumber, accountconfigurations.bankname, accountconfigurations.bankregnumber, accountconfigurations.invoicenumberminlength, accountconfigurations.invoicenumberprefix, accountconfigurations.invoicenumberstartvalue
//             FROM accounts 
//             LEFT JOIN accountconfigurations ON accountconfigurations.fk_accounts_id = accounts.id   
//             WHERE accounts.id = ?`;
//    db.query(sQuery, aParams, (err, ajCustomers) => {
//       if(err){
//           console.log('err', err)
//           return fCallback(true)
//       }
//       const jCustomer = ajCustomers[0];
//       return fCallback(false, jCustomer)
//   }) 
// }

accountsController.getSpecificAccount = (iAccountId, fCallback) => {
   aParams = [iAccountId]
   sQuery = `SELECT id, name, cvr, street, zipcode, city, email, phone
            FROM accounts 
            WHERE id = ?`;
   db.query(sQuery, aParams, (err, ajAccounts) => {
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      const jAccount = ajAccounts[0];
      sQuery = `SELECT invoicenumberstartvalue, invoicenumberprefix, invoicenumberminlength, bankname, bankregnumber, bankaccountnumber
               FROM accountconfigurations 
               WHERE fk_accounts_id = ?`;
      db.query(sQuery, aParams, (err, ajConfigurations) => {
         if(err){
            console.log('err', err)
            return fCallback(true)
         }
         const jConfiguration = ajConfigurations[0];
         jAccount.configuration = jConfiguration;
         return fCallback(false, jAccount)
      }) 
      // return fCallback(false, jAccount)
   }) 
}

accountsController.getAccountStats = (iAccountId, fCallback) => {
   console.log('GETTING STATS');
   aParams = [iAccountId]
   sQuery = `SELECT COUNT(id) AS amount, SUM(totalprice) AS total, AVG(totalprice) AS avgPrice
            FROM invoices 
            WHERE fk_accounts_id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
          console.log('err', err)
          return fCallback(true)
      }
      // console.log(jResult);
      return fCallback(false, jResult)
  }) 
}



module.exports = accountsController