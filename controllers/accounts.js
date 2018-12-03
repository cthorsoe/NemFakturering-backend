var accountsController = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = { status: 'success'}

accountsController.getSpecificAccount = (sIdentifier, parameter, bAuthorizing, fCallback) => {
   aParams = [parameter]
   sQuery = `SELECT id, name, cvr, street, zipcode, city, email, phone` + (bAuthorizing ? ', password' : '') + `
            FROM accounts 
            WHERE ${sIdentifier} = ?`;
   db.query(sQuery, aParams, (err, ajAccounts) => {
      if(err){
         console.log(err)
         return fCallback(true, err)
      }else if(ajAccounts.length < 1){
         return fCallback(false, undefined)
      }
      const jAccount = ajAccounts[0];
      sQuery = `SELECT invoicenumberstartvalue, invoicenumberprefix, invoicenumberminlength, bankname, bankregnumber, bankaccountnumber
               FROM accountconfigurations 
               WHERE fk_accounts_id = ?`;
      aParams = [jAccount.id]
      db.query(sQuery, aParams, (err, ajConfigurations) => {
         if(err){
            console.log('err', err)
            return fCallback(true)
         }
         const jConfiguration = ajConfigurations[0];
         jAccount.configuration = jConfiguration;
         return fCallback(false, jAccount)
      })
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

accountsController.login = (req, res, next, jLoginForm, fCallback) => {
   passport.authenticate('local', (err, user, info) => {
      if(info) {return res.send(info.message)}
      if (err) { return next(err); }
      // if (!user) { return res.redirect('/login'); }
      if (!user) { fCallback(false, undefined) }
      req.login(user, (err) => {
        if (err) { return next(err); }
        return fCallback(false, user)
      //   return res.redirect('/accounts/auth');
      })
   })(req, res, next);
   // passport.authenticate('local', (err, user, info) => {
   //    if(info) {
   //       console.log('INFO', info)
   //       return res.send(info.message)
   //    }
   //    if (err) { 
   //       console.log('AUTH ERR')
   //       return next(err); 
   //    }
   //    if (!user) { 
   //       console.log('!user')
   //       return res.redirect('/accounts/login');
   //    }
   //    req.login(user, (err) => {
   //       if (err) { return next(err); }
   //       //return res.redirect('/accounts/auth');
   //       return fCallback(false, 'SUCCESS')
   //    })
   // })(req, res, next);
}

// accountsController.retrieveAccountFromDB = (sIdentifier, parameter, fCallback) => {
//    aParams = [parameter]
//    sQuery = `SELECT id, name, cvr, street, zipcode, city, email, phone` + (bAuthorizing ? ', password' : '') + `
//             FROM accounts 
//             WHERE ${sIdentifier} = ?`;
//    db.query(sQuery, aParams, (err, ajAccounts) => {
//       if(err){
//          console.log(err)
//          return fCallback(true, err)
//       }else if(ajAccounts.length < 1){
//          return fCallback({ message: 'No account was found' })
//       }
//       const jAccount = ajAccounts[0];
//       sQuery = `SELECT invoicenumberstartvalue, invoicenumberprefix, invoicenumberminlength, bankname, bankregnumber, bankaccountnumber
//                FROM accountconfigurations 
//                WHERE fk_accounts_id = ?`;
//       aParams = [jAccount.id]
//       db.query(sQuery, aParams, (err, ajConfigurations) => {
//          if(err){
//             console.log('err', err)
//             return fCallback(true)
//          }
//          const jConfiguration = ajConfigurations[0];
//          jAccount.configuration = jConfiguration;
//          return fCallback(false, jAccount)
//       })
//    }) 
// }



module.exports = accountsController