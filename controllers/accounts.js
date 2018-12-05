var accountsController = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = {status: 'success'}

accountsController.createAccount = (jAccount, fCallback) => {
   console.log('CREATING ACCOUNT', jAccount)
   accountsController.findExistingAccount(jAccount.email, jAccount.username, (err, sResponse) => {
      console.log('sResponse', sResponse)
      switch (sResponse) {
         case 'EMAILANDUSERNAMETAKEN':
         case 'EMAILTAKEN':
         case 'USERNAMETAKEN':
            return fCallback(false, { status:'TAKEN', message: sResponse })
         case 'AVAILABLE':
            bcrypt.genSalt(process.env.ENCRYPTION_ROUNDS, (err, salt) => {
               if(err){
                  console.log('ERR GEN SALT')
                  return fCallback(true, {status:'ERROR'})
               }
               bcrypt.hash(jAccount.password, salt, undefined, (err, incrypted) => {
                  if(err){
                     console.log('ERR HASHING')
                     return fCallback(true, {status:'ERROR'})
                  }
                  jAccount.password = incrypted;
                  aParams = [jAccount];
                  sQuery = `INSERT INTO accounts SET ?`;
                  db.query(sQuery, aParams, (err, jResult) => {
                     console.log('res', jResult)
                     if(err){
                        console.log('DB QUERY ERR')
                        return fCallback(true, {status:'ERROR'})
                     }
                     if(jResult.affectedRows == 1){
                        aParams = [jResult.insertId];
                        sQuery = `INSERT INTO accountconfigurations SET fk_accounts_id = ?`;
                        db.query(sQuery, aParams, (err, jResult) => {
                           console.log('res', jResult)
                           if(err){
                              console.log('DB CONFIG QUERY ERR')
                              return fCallback(true, {status:'ERROR'})
                           }
                           if(jResult.affectedRows == 1){
                              return fCallback(false, {status:'SUCCESS'})
                           }
                        })
                     }
                  })
               })
            });
            break;
         case 'ERROR':
         default:
            console.log('ERROR OR DEFAULT CASE')
            return fCallback(true, { status:'ERROR' })
      }
   })
}

accountsController.findExistingAccount = (sEmail, sUsername, fCallback) => {
   aParams = [sEmail, sUsername]
   sQuery = `SELECT id, email, username
            FROM accounts 
            WHERE email = ? OR username = ?`;
   db.query(sQuery, aParams, (err, ajAccounts) => {
      if(err){
         console.log('FIND ACCOUNT QUERY ERROR', err)
         return fCallback(true, 'ERROR')
      }
      if(ajAccounts.length > 0){
         let jAccount = ajAccounts[0];
         if(jAccount.email == sEmail && jAccount.username == sUsername){
            return fCallback(false, 'EMAILANDUSERNAMETAKEN')
         }else if(jAccount.email == sEmail){
            return fCallback(false, 'EMAILTAKEN')
         }else if(jAccount.username == sUsername){
            return fCallback(false, 'USERNAMETAKEN')
         }
      }else{
         return fCallback(false, 'AVAILABLE')
      }
   }) 
}

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
      
      return fCallback(false, jResult)
  }) 
}

accountsController.login = (req, res, next, fCallback) => {
   passport.authenticate('local', (err, user, info) => {
      if (info) { return res.send(info.message) }
      if (err) { return next(err); }
      if (!user) { fCallback(false, undefined) }
      req.login(user, (err) => {
         if (err) { return next(err); }
         delete user.password;
         return fCallback(false, user)
      })
   })(req, res, next);
}

module.exports = accountsController