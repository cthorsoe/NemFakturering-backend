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
                        console.log('DB QUERY ERR', err)
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
   // sQuery = `SELECT id, name, cvr, street, zipcode, city, email, phone` + (bAuthorizing ? ', password' : '') + `
   //          FROM accounts 
   //          WHERE ${sIdentifier} = ?`;
   sQuery = `SELECT id, name, cvr, street, zipcode, city, email, phone` + (bAuthorizing ? ', password' : '') + `
            FROM accounts 
            WHERE ` + db.escapeId(sIdentifier) + ` = ?`;
   db.query(sQuery, aParams, (err, ajAccounts) => {
      if(err){
         console.log(err)
         return fCallback(true, err)
      }else if(ajAccounts.length < 1){
         return fCallback(false, undefined)
      }
      const jAccount = ajAccounts[0];
      accountsController.getAccountConfiguration(jAccount.id, (err, jConfiguration) => {
         if(err){
            console.log('err', err)
            return fCallback(true, err)
         }
         jAccount.configuration = jConfiguration;
         return fCallback(false, jAccount);
      })
   }) 
}

accountsController.getAccountConfiguration = (iAccountId, fCallback) =>{
   aParams = [iAccountId]
   sQuery = `SELECT invoicenumberstartvalue, invoicenumberprefix, invoicenumberminlength, bankname, bankregnumber, bankaccountnumber, usetaxes, taxpercentage, itempricesincludetaxes, paymentduedays
               FROM accountconfigurations 
               WHERE fk_accounts_id = ?`;
   db.query(sQuery, aParams, (err, ajConfigurations) => {
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      const jConfiguration = ajConfigurations[0];
      jConfiguration.usetaxes = (jConfiguration.usetaxes == 1);
      jConfiguration.itempricesincludetaxes = (jConfiguration.itempricesincludetaxes == 1);
      console.log('jConfiguration', jConfiguration)
      return fCallback(false, jConfiguration)
   })
}

accountsController.updateAccountAndConfiguration = (jAccount, fCallback) => {
   const jPostedAccount = Object.assign({}, jAccount);
   const jConfiguration = jPostedAccount.configuration;
   delete jAccount.configuration;
   delete jAccount.id;

   aParams = [jAccount, jPostedAccount.id];
   sQuery = `UPDATE accounts
            SET ?
            WHERE id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      console.log('res', jResult)
      if(err){
         console.log('err', err)
            return fCallback(true)
      }
      aParams = [jConfiguration, jPostedAccount.id];
      sQuery = `UPDATE accountconfigurations
               SET ?
               WHERE fk_accounts_id = ?`;
      db.query(sQuery, aParams, (err, jResult) => {
         console.log('res', jResult)
         if(err){
            console.log('err', err)
            return fCallback(true)
         }
         return fCallback(false, jPostedAccount);
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

/* accountsController.login = (req, res, next, fCallback) => {
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
} */

accountsController.login = (req, jLoginForm, fCallback) => {
   let sIdentifier = jLoginForm.identifier
   let sField = 'username'
   if(functions.validateEmail(sIdentifier)){
      sField = 'email'
   }
   accountsController.getSpecificAccount(sField, sIdentifier, true, (err, jAccount) => {
      if(err){
         console.log('ERR', err)
         return fCallback(true, { status: 'ERROR' })
      }
      if(!jAccount){
         return fCallback(false, { status: 'NOUSER' })
      }
      if(!bcrypt.compareSync(jLoginForm.password, jAccount.password)){
         return fCallback(false, { status: 'NOMATCH' })
      }
      accountsController.setLoginCookie(req, jAccount.id, (err, jResponse) => {
         if(err){
            return fCallback(true, { status: 'ERROR' })
         }
         delete jAccount.password
         return fCallback(false, jAccount)
      })
   })
}

accountsController.setLoginCookie = (req, iUserId, fCallback) => {
   bcrypt.genSalt(process.env.ENCRYPTION_ROUNDS, (err, salt) => {
      if(err){
         console.log('ERR GEN SALT')
         return fCallback(true, err)
      }
      bcrypt.hash(iUserId, salt, undefined, (err, incrypted) => {
         if(err){
            console.log('ERR HASHING')
            return fCallback(true, err)
         }
         let sSessionKey = uuid()
         req.cookies.sessionvalue = incrypted
         req.cookies.sessionkey = sSessionKey
         aParams = [{
            sessionkey: sSessionKey,
            sessionsalt: salt,
            fk_accounts_id: iUserId
         }];
         sQuery = `INSERT INTO loginsessions SET ?`;
         db.query(sQuery, aParams, (err, jResult) => {
            if(err){
               console.log('err', err)
               return fCallback(true, err)
            }
            return fCallback(false, 'COOKIE SET')
         })
      });
   });
}

accountsController.getSessionData = (sSessionKey, fCallback) => {
   aParams = [sSessionKey];
   console.log('sSessionKey', sSessionKey)
   sQuery = `SELECT sessionsalt, fk_accounts_id FROM loginsessions WHERE sessionkey = ?`;
   db.query(sQuery, aParams, (err, ajSessionData) => {
      console.log('res', ajSessionData)
      if(err){
         console.log('err', err)
         return fCallback(true)
      }
      if(ajSessionData.length < 1){
         return fCallback(true)
      }
      let jSessionData = ajSessionData[0]
      return fCallback(false, jSessionData);
      // bcrypt.hash(jSessionData.fk_accounts_id, jSessionData.sessionsalt, undefined, (err, incrypted) => {
      //    if(err){
      //       console.log('ERR HASHING')
      //       return res.send('ERROR')
      //    }
      //    if(incrypted == sSessionValue){
      //       return res.send('MATCH')
      //    }
      //    return res.send('NO MATCH')
      // });
   }) 
}



module.exports = accountsController