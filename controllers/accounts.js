var accountsController = {}
var sQuery = "";
var aParams = [];
var jError = {};
var jSuccess = {status: 'success'}
const iSubscriptionAmount = 7500
const sStripePlanId = 'plan_EIsiU64LzwXhya'

accountsController.createAccount = (jAccount, fCallback) => {
   let bValidEmail = global.functions.validateEmail(jAccount.email);
   if(!bValidEmail){
      return fCallback(false, { status:'INVALIDEMAIL', message: '' })
   }
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
                  jAccount.verificationid = global.functions.genRandomString(64)
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
                              accountsController.sendVerificationEmail(jAccount);
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

accountsController.sendVerificationEmail = (jAccount) => {
   let sSubject = 'Easy Invoicing verification email'
   let sHtml = `
      <h2>Welcome to Easy Invoicing, ${ jAccount.name }!</h2>
      <p>
         Thank you for registering at Easy Invoicing.<br>
         In order to get started using your account, you will have to verify your email.<br>
         To do that, you need to <a href="${ process.env.BACKEND_URL }/accounts/verify/${ jAccount.verificationid }">follow the verification link.</a><br><br>
         Hope you enjoy your stay at Easy Invoicing!
      </p>
   `
   global.functions.sendEmail(jAccount.email, sSubject, sHtml, true)
}

accountsController.verifyAccount = (sVerificationId, fCallback) => {
   aParams = [1, sVerificationId]
   sQuery = `UPDATE accounts 
            SET emailverified = ? 
            WHERE verificationid = ?`
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            'XXX', 
            'controllers/accounts.js --> verifyAccount --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to verify the email of an account',
            err
         )
         return fCallback(jError)
      }
      if(jResult.affectedRows == 1){
         return fCallback(false, 'SUCCESS')
      }
      return fCallback(false, 'NOMATCH')
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
   sQuery = `SELECT id, name, cvr, street, zipcode, city, email, phone ` + (bAuthorizing ? ', emailverified, password' : '') + `
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
         accountsController.getSubscription(jAccount.id, (err, jSubscription) => {
            if(err){
               return fCallback(err);
            }
            jAccount.subscription = jSubscription
            return fCallback(false, jAccount);
         })
      })
   }) 
}

accountsController.getAccountConfiguration = (iAccountId, fCallback) =>{
   aParams = [iAccountId]
   sQuery = `SELECT invoicenumberstartvalue, invoicenumberprefix, invoicenumberminlength, invoicetemplate, bankname, bankregnumber, bankaccountnumber, usetaxes, taxpercentage, itempricesincludetaxes, paymentduedays, logo IS NOT NULL as hasLogo 
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
      jConfiguration.hasLogo = (jConfiguration.hasLogo == 1);
      /* if(jConfiguration.logo == null){
         jConfiguration.logo = 'NONE';
      } */
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
      if(jConfiguration.invoicenumberprefix && jConfiguration.invoicenumberprefix.trim() == ''){
         jConfiguration.invoicenumberprefix = null;
      }
      accountsController.uploadAccountLogo(jConfiguration.logo, (err, sLogoPath) => {
         if(err){ 
            jError = global.functions.createError(
               'XXX', 
               'controllers/accounts.js --> updateAccountAndConfiguration --> uploadAccountLogo() ERROR',
               'An error occured when trying to run the uploadAccountLogo() function',
               err
            )
            return fCallback(jError)
         }
         console.log('sLogoPath IS', sLogoPath)
         jConfiguration.logo = sLogoPath
         if(jConfiguration.removeLogo && sLogoPath == null) {
            jConfiguration.logo = null
         }else if(sLogoPath == null){
            delete jConfiguration.logo
         }
         delete jConfiguration.removeLogo
         aParams = [jConfiguration, jPostedAccount.id]
         sQuery = `UPDATE accountconfigurations
                  SET ?
                  WHERE fk_accounts_id = ?`
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
            jPostedAccount.configuration.hasLogo = (jConfiguration.logo !== null)
            delete jPostedAccount.configuration.logo
            return fCallback(false, jPostedAccount);
         })
      })
       
   }) 
}

accountsController.uploadAccountLogo = (sLogo, fCallback) => {
   if(sLogo == null){
      return fCallback(false, null)
   }
   let base64Data = sLogo.replace(/^data:image\/png;base64,/, "");
   base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
   let sAvatarPath = 'images/logos/' + global.functions.genRandomString(32) + '.png';
   // console.log('sLogo', sLogo)
   sharp(Buffer.from(base64Data, 'base64'))
   .resize({ width: 256 })
   .toBuffer()
   .then(data => {
      console.log('data IS', data)
      global.fs.writeFile(sAvatarPath, data, (err) => {
         if(err){
            console.log('SAVING ERROR', err)
            return fCallback(true)
         }
         return fCallback(false, sAvatarPath)
      });
   }).catch(err => {
      console.log('ERR', err)
   });   
}

accountsController.getAccountLogo = (iAccountId, fCallback) => {
   aParams = [iAccountId]
   sQuery = `SELECT logo
            FROM accountconfigurations 
            WHERE fk_accounts_id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            'XXX', 
            'controllers/accounts.js --> getAccountLogo --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to get account logo',
            err
         )
         return fCallback(jError)
      }
      console.log(jResult);
      if(jResult.length > 0){
         jResult = jResult[0]
         if(jResult.logo == null){
            jResult.logo = '/images/logo/nologo.jpg'
         }
         let sLogoPath = global.path.join(__dirname, '../', jResult.logo)
         fs.readFile(sLogoPath, (err, imgLogo) => {
            return fCallback(false, imgLogo)
         });
      }
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
      if(jAccount.emailverified == 0){
         return fCallback(false, { status: 'NOTVERIFIED' })
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
         delete jAccount.emailverified
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

accountsController.getAccountsStripeCustomerId = (iAccountId, fCallback) => {
   aParams = [iAccountId];
   sQuery = `SELECT stripecustomerid FROM accounts WHERE id = ?`;
   db.query(sQuery, aParams, (err, ajResult) => {
      if(err){
         jError = global.functions.createError(
            'XXX', 
            'controllers/accounts.js --> getAccountsStripeCustomerId --> DB QUERY ERROR',
            'An error occured when trying to run the SQL Query to get the session data',
            err
         )
         return fCallback(jError)
      }
      const jResult = ajResult[0];
      return fCallback(false, jResult.stripecustomerid)
   }) 
}

accountsController.recievePaymentAndActivate = (iAccountId, jPaymentData, fCallback)  => {
   accountsController.getAccountsStripeCustomerId(iAccountId, (err, sStripeCustomerId) => {
      accountsController.chargeWithStripe(sStripeCustomerId, iAccountId, jPaymentData, (err, jResponse) => {
         if(err){
            return fCallback(true, undefined)   
         }
         return fCallback(false, jResponse)
      })
   })
}

accountsController.chargeWithStripe = (sStripeCustomerId, iAccountId, jPaymentData, fCallback) => {
   if(sStripeCustomerId){
      stripe.charges.create({
         amount: iSubscriptionAmount,
         currency: "DKK",
         description: "Easy Invoicing Payment",
         customer: sStripeCustomerId 
      }, (err, charge) => {
         if(err){
            return fCallback(true, undefined)
         }
         return fCallback(false, undefined)
      });
   }else{
      accountsController.createStripeCustomer(jPaymentData)
      .then(customer => stripe.charges.create({
         amount:iSubscriptionAmount,
         description: 'Easy Invoicing Payment',
         currency: 'DKK',
         customer:customer.id,
      }))
      .then(charge => {
         console.log('CHARGE IS', charge)
         accountsController.setAccountsStripeCustomer(iAccountId, charge.customer, (err) => {
            if(err){
               return fCallback(err, undefined)
            }
            return fCallback(false, {status: 'SUCCESS'})
         })
      })
   }
}

accountsController.createStripeCustomer = (jPaymentData) => {
   return stripe.customers.create({
      email:jPaymentData.stripeEmail,
      source: jPaymentData.stripeToken
   })
}

accountsController.createStripeSubscription = (sStripeCustomerId) => {
   return stripe.subscriptions.create({
      customer: sStripeCustomerId,
      items: [
         {
            plan: sStripePlanId,
         },
      ]
   })
}

accountsController.getStripeSubscription = (sStripeSubscriptionId) => {
   return stripe.subscriptions.retrieve(sStripeSubscriptionId)
}

accountsController.updateStripeSubscription = (sStripeSubscriptionId, jKeysToUpdate) => {
   return stripe.subscriptions.update(
      sStripeSubscriptionId,
      jKeysToUpdate
   );
}

accountsController.getSubscriptionId =  (iAccountId, fCallback) => {
   aParams = [iAccountId];
   sQuery = `SELECT stripesubscriptionid FROM accounts WHERE id = ?`;
   db.query(sQuery, aParams, (err, ajStripeSubscriptionIds) => {
      if(err){
         jError = global.functions.createError(
            'XXX', 
            'controllers/accounts.js --> getSubscriptionId() --> DB QUERY ERROR',
            'An error occured when running the SQL Query to get stripe subscription id',
            err
         )
         return fCallback(jError)
      }
      const sStripeSubscriptionId = ajStripeSubscriptionIds[0].stripesubscriptionid
      if(sStripeSubscriptionId == null){
         return fCallback(false, undefined)
      }
      return fCallback(false, sStripeSubscriptionId)
   }) 
}

accountsController.getSubscription = (iAccountId, fCallback) => {
   accountsController.getSubscriptionId(iAccountId, (err, sStripeSubscriptionId) => {
      if(err){
         return fCallback(err)
      }
      if(!sStripeSubscriptionId){
         return fCallback(false, undefined)
      }
      accountsController.getStripeSubscription(sStripeSubscriptionId)
      .then(jSubscription => {
         console.log('GOT SUBSCRIPTION')
         jSubscriptionData = functions.filterStripeSubscriptionData(jSubscription)
         return fCallback(false, jSubscriptionData)
      })
   })
}

accountsController.setAccountsStripeCustomer = (iAccountId, sStripeCustomerId, fCallback) => {
   aParams = [sStripeCustomerId, iAccountId];
   sQuery = `UPDATE accounts SET stripecustomerid = ? WHERE id = ?`;
   db.query(sQuery, aParams, (err, jResult) => {
      if(err || jResult.affectedRows != 1){
         jError = global.functions.createError(
            '085', 
            'controllers/accounts.js --> setAccountsStripeCustomer --> DB QUERY ERROR',
            'An error occured when running the SQL Query to update stripecustomerid of account',
            err
         )
         return fCallback(jError)
      }
      return fCallback(false)
   }) 
}

accountsController.saveStripeSubscription = (iAccountId, jPaymentData, fCallback) => {
   console.log(jPaymentData)
   accountsController.createStripeCustomer(jPaymentData)
   .then(customer => accountsController.createStripeSubscription(customer.id)
   .then(subscription => accountsController.setStripeSubscription(subscription.id, iAccountId, (err) => {
      if(err){
         jError = global.functions.createError(
            '087', 
            'controllers/accounts.js --> saveStripeSubscription --> DB QUERY ERROR',
            'An error occured when running the setStripeSubscription() function',
            err
         )
         return fCallback(jError)
      }
      const jSubscription = functions.filterStripeSubscriptionData(subscription);
      return fCallback(false, jSubscription)
   })))
}

/* accountsController.createStripeSubscription = (iAccountId, jPaymentData, fCallback) => {
   accountsController.getAccountsStripeCustomerId(iAccountId, (err, sStripeCustomerId) => {
      if(err){
         return fCallback(err)
      }
      if(sStripeCustomerId == null){
         accountsController.createStripeCustomer(jPaymentData)
         .then(customer => accountsController.createStripeSubscription(customer.id)
         .then(subscription => accountsController.setStripeSubscription(subscription.id, iAccountId, (err) => {
            if(err || jResult.affectedRows != 1){
               return fCallback(true)
            }
            return fCallback(true)
         })))
         // accountsController.setStripeSubscription(subscription.id, iAccountId, (err) => {
         //    if(err || jResult.affectedRows != 1){
         //       return fCallback(true)
         //    }
         //    return fCallback(true)
         // })
      }
      accountsController.createStripeSubscription(sStripeCustomerId)
      .then(subscription => accountsController.setStripeSubscription(subscription.id, iAccountId, (err) => {
         if(err || jResult.affectedRows != 1){
            return fCallback(true)
         }
         return fCallback(true)
      }))
   })
} */

accountsController.setStripeSubscription = (sStripeSubscriptionId, iAccountId, fCallback) => {
   aParams = [sStripeSubscriptionId, iAccountId]
   sQuery = 'UPDATE accounts SET stripesubscriptionid = ? WHERE id = ?'
   db.query(sQuery, aParams, (err, jResult) => {
      if(err){
         jError = global.functions.createError(
            'XXX', 
            'controllers/accounts.js --> setStripeSubscription --> DB QUERY ERROR',
            'An error occured when running the DB query to set a stripe subscription on an account',
            err
         )
         return fCallback(jError)
      }
      if(jResult.affectedRows != 1){
         return fCallback(true)
      }
      return fCallback(false)
   }) 
}

accountsController.cancelStripeSubscription = (iAccountId, fCallback) => {
   accountsController.getSubscriptionId(iAccountId, (err, sStripeSubscriptionId) => {
      if(err){
         return fCallback(err)
      }
      accountsController.updateStripeSubscription(sStripeSubscriptionId, { "cancel_at_period_end": true })
      .then(subscription => {
         const jSubscription = functions.filterStripeSubscriptionData(subscription)
         return fCallback(false, jSubscription)
      })
   })
}

accountsController.reactivateStripeSubscription = (iAccountId, fCallback) => {
   accountsController.getSubscriptionId(iAccountId, (err, sStripeSubscriptionId) => {
      if(err){
         return fCallback(err)
      }
      accountsController.updateStripeSubscription(sStripeSubscriptionId, { "cancel_at_period_end": false })
      .then(subscription => {
         const jSubscription = functions.filterStripeSubscriptionData(subscription)
         return fCallback(false, jSubscription)
      })
   })
}

accountsController.clearSession = (sSessionKey, sSessionValue, fCallback) => {
   console.log('CLEARING SESSION')
   accountsController.getSessionData(sSessionKey, (err, jSessionData) => {
      console.log('GOT SESSION DATA', jSessionData)
      if(err){
         return fCallback(true)
      }
      bcrypt.hash(jSessionData.fk_accounts_id, jSessionData.sessionsalt, undefined, (err, incrypted) => {
         
         console.log('HASHED', incrypted, sSessionValue)
         if(err){
            console.log('ERR HASHING')
            return fCallback(true)
         }
         if(incrypted == sSessionValue){
            aParams = [sSessionKey]
            sQuery = 'DELETE FROM loginsessions WHERE sessionkey = ?'
            db.query(sQuery, aParams, (err, jResult) => {
               if(err){
                  jError = global.functions.createError(
                     'XXX', 
                     'controllers/accounts.js --> clearSession() --> DB QUERY ERROR',
                     'An error occured when running the SQL Query to delete loginsession',
                     err
                  )
                  return fCallback(jError)
               }
               if(jResult.affectedRows != 1){
                  return fCallback(true)
               }
               return fCallback(false)
            })
         }
      });
   })
}

module.exports = accountsController