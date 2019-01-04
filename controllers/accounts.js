var accountsController = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = {status: 'success'}

accountsController.createAccount = (jAccount, fCallback) => {
   accountsController.findExistingAccount(jAccount.email, jAccount.username, (err, sResponse) => {
      if(err){
         jError = global.functions.createError(
            '003', 
            'controllers/accounts.js --> createAccount --> findExistingAccount() ERROR',
            'An error was returned when running the findExistingAccount() function',
            err
         )
        return fCallback(jError)
      }
      switch (sResponse) {
         case 'EMAILANDUSERNAMETAKEN':
         case 'EMAILTAKEN':
         case 'USERNAMETAKEN':
            return fCallback(false, { status:'TAKEN', message: sResponse })
         case 'AVAILABLE':
            bcrypt.genSalt(process.env.ENCRYPTION_ROUNDS, (err, salt) => {
               if(err){
                  jError = global.functions.createError(
                     '005', 
                     'controllers/accounts.js --> createAccount --> genSalt() ERROR',
                     'An error was returned when trying to generateSalt value using the genSalt() function',
                     err
                  )
                  return fCallback(jError)
               }
               bcrypt.hash(jAccount.password, salt, undefined, (err, incrypted) => {
                  if(err){
                     jError = global.functions.createError(
                        '007', 
                        'controllers/accounts.js --> createAccount --> hash() ERROR',
                        'An error was returned when trying to hash the value using the hash() function',
                        err
                     )
                     return fCallback(jError)
                  }
                  jAccount.password = incrypted;
                  aParams = [jAccount];
                  sQuery = `INSERT INTO accounts SET ?`;
                  db.query(sQuery, aParams, (err, jResult) => {
                     if(err){
                        jError = global.functions.createError(
                           '009', 
                           'controllers/accounts.js --> createAccount --> DB QUERY ERROR',
                           'An error was returned when trying to execute the query to create a new account',
                           err
                        )
                        return fCallback(jError)
                     }
                     if(jResult.affectedRows == 1){
                        aParams = [jResult.insertId];
                        sQuery = `INSERT INTO accountconfigurations SET fk_accounts_id = ?`;
                        db.query(sQuery, aParams, (err, jResult) => {
                           // console.log('res', jResult)
                           if(err){
                              jError = global.functions.createError(
                                 '011', 
                                 'controllers/accounts.js --> createAccount --> DB QUERY ERROR',
                                 'An error was returned when trying to execute the query to create a new account configuration',
                                 err
                              )
                              return fCallback(jError)
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
            jError = global.functions.createError(
               '013', 
               'controllers/accounts.js --> createAccount --> UNEXPECTED RESPONSE',
               'Recieved an unexpected response from the findExistingAccount() function'
            )
            return fCallback(jError)
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
         jError = global.functions.createError(
            '015', 
            'controllers/accounts.js --> findExistingAccount --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to find an existing account',
            err
         )
         return fCallback(jError)
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
            WHERE ` + db.escapeId(sIdentifier) + ` = ?`;
   db.query(sQuery, aParams, (err, ajAccounts) => {
      if(err){
         jError = global.functions.createError(
            '017', 
            'controllers/accounts.js --> getSpecificAccount --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to find a specific account',
            err
         )
         return fCallback(jError)
      }else if(ajAccounts.length < 1){
         return fCallback(false, undefined)
      }
      const jAccount = ajAccounts[0];
      accountsController.getAccountConfiguration(jAccount.id, (err, jConfiguration) => {
         if(err){
            jError = global.functions.createError(
               '019', 
               'controllers/accounts.js --> getSpecificAccount --> DB QUERY ERROR',
               'An error occured when trying to run the SQL Query to find a specific accounts accountconfiguration',
               err
            )
            return fCallback(jError)
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
         jError = global.functions.createError(
            '021', 
            'controllers/accounts.js --> getAccountConfiguration --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to find a specific accounts accountconfiguration',
            err
         )
         return fCallback(jError)
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
      if(err){
         jError = global.functions.createError(
            '023', 
            'controllers/accounts.js --> updateAccountAndConfiguration --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to update an account',
            err
         )
         return fCallback(jError)
      }
      aParams = [jConfiguration, jPostedAccount.id];
      sQuery = `UPDATE accountconfigurations
               SET ?
               WHERE fk_accounts_id = ?`;
      db.query(sQuery, aParams, (err, jResult) => {
         if(err){ 
            jError = global.functions.createError(
               '025', 
               'controllers/accounts.js --> updateAccountAndConfiguration --> DB QUERY ERROR',
               'An error occured when trying to run the SQL Query to update an accountconfiguration',
               err
            )
            return fCallback(jError)
         }
         return fCallback(false, jPostedAccount);
      }) 
   }) 
}

accountsController.getAccountStats = (iAccountId, fCallback) => {
   aParams = [iAccountId]
   sQuery = `SELECT COUNT(id) AS amount, SUM(totalprice) AS total, AVG(totalprice) AS avgPrice
            FROM invoices 
            WHERE fk_accounts_id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            '027', 
            'controllers/accounts.js --> getAccountStats --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to get account stats',
            err
         )
         return fCallback(jError)
      }
      return fCallback(false, jResult)
  }) 
}

accountsController.login = (req, jLoginForm, fCallback) => {
   let sIdentifier = jLoginForm.identifier
   let sField = 'username'
   if(functions.validateEmail(sIdentifier)){
      sField = 'email'
   }
   accountsController.getSpecificAccount(sField, sIdentifier, true, (err, jAccount) => {
      if(err){
         jError = global.functions.createError(
            '029', 
            'controllers/accounts.js --> login --> getSpecificAccount() ERROR',
            'An error occured when trying to run the getSpecificAccount() function',
            err
         )
         return fCallback(jError)
      }
      if(!jAccount){
         return fCallback(false, { status: 'NOUSER' })
      }
      if(!bcrypt.compareSync(jLoginForm.password, jAccount.password)){
         return fCallback(false, { status: 'NOMATCH' })
      }
      accountsController.setLoginCookie(req, jAccount.id, (err, jResponse) => {
         if(err){
            jError = global.functions.createError(
               '031', 
               'controllers/accounts.js --> login --> setLoginCookie() ERROR',
               'An error occured when trying to run the setLoginCookie() function',
               err
            )
            return fCallback(jError)
         }
         delete jAccount.password
         return fCallback(false, jAccount)
      })
   })
}

accountsController.setLoginCookie = (req, iUserId, fCallback) => {
   bcrypt.genSalt(process.env.ENCRYPTION_ROUNDS, (err, salt) => {
      if(err){
         jError = global.functions.createError(
            '033', 
            'controllers/accounts.js --> setLoginCookie --> genSalt() ERROR',
            'An error occured when trying to generate the salt value using the genSalt() function',
            err
         )
         return fCallback(jError)
      }
      bcrypt.hash(iUserId, salt, undefined, (err, incrypted) => {
         if(err){
            jError = global.functions.createError(
               '035', 
               'controllers/accounts.js --> setLoginCookie --> hash() ERROR',
               'An error occured when trying to hash the value using the hash() function',
               err
            )
            return fCallback(jError)
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
               jError = global.functions.createError(
                  '037', 
                  'controllers/accounts.js --> setLoginCookie --> DB QUERY ERROR',
                  'An error occured when trying to run the SQL Query to create a new loginsession in the DB',
                  err
               )
               return fCallback(jError)
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
         jError = global.functions.createError(
            '039', 
            'controllers/accounts.js --> getSessionData --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to get the session data',
            err
         )
         return fCallback(jError)
      }
      if(ajSessionData.length < 1){
         return fCallback(true)
      }
      let jSessionData = ajSessionData[0]
      return fCallback(false, jSessionData);
   }) 
}

module.exports = accountsController