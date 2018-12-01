const crypto = require('crypto')
const moment = require('moment')

var jFunctions = {}
const jError = {} // ??

jFunctions.formatDate = (date, format = 'DD-MM-YYYY') => {
    return moment(date).format(format);
}
  
jFunctions.genRandomString = function(iLength, bUpperCase = false){
    let = sRandomString = crypto.randomBytes(Math.ceil(iLength/2)).toString('hex').slice(0,iLength);
    if(bUpperCase){
        sRandomString = sRandomString.toUpperCase();
    }
    return sRandomString
};
  
jFunctions.sha512 = function(sInput, sSalt){
    var hash = crypto.createHmac('sha512', sSalt); /** Hashing algorithm sha512 */
    hash.update(sInput);
    var sHash = hash.digest('hex');
    return {
        salt:sSalt,
        hash:sHash
    };
};
  
jFunctions.createSaltHash = function(sInput) {
    var sSalt = jFunctions.genRandomString(16) /** Returns salt of length 16 */
    var jSaltHash = jFunctions.sha512(sInput, sSalt)
    return jSaltHash
}

jFunctions.prepareInvoiceList = ajInvoices => {
    let ajPreparedInvoices = []
    console.log('preparingInvoices');
    for(let i = 0; i < ajInvoices.length; i++) {
        const jInvoice = ajInvoices[i]
        console.log('invoice hit', i);
        if(ajInvoices[i-1] && ajInvoices[i-1].invoiceId == ajInvoices[i].invoiceId && ajPreparedInvoices.length > 0) {
            const jItem = {
               id : jInvoice.itemId,
               name : jInvoice.itemName,
               amount : jInvoice.units,
               defaultprice : 0,
               price : jInvoice.priceprunit
            };
            ajPreparedInvoices[ajPreparedInvoices.length - 1].items.push(jItem)
            console.log('pushed item', jItem);
        }else{
            const jPreparedInvoice = {
               id: jInvoice.invoiceId,
               createddate: jInvoice.createddate,
               invoicenumber: jInvoice.invoicenumber,
               totalprice: jInvoice.totalprice,
               totalpercentagediscount: jInvoice.totalpercentagediscount,
               remarks: jInvoice.remarks,
               items: [{
                  id: jInvoice.itemId,
                  name: jInvoice.itemName,
                  amount: jInvoice.units,
                  defaultprice: 0,
                  price: jInvoice.priceprunit
               }],
               customer: {
                  id: jInvoice.customerId,
                  name: jInvoice.customerName,
                  contactperson: jInvoice.contactperson,
                  cvr: jInvoice.cvr,
                  street: jInvoice.street,
                  zipcode: jInvoice.zipcode,
                  city: jInvoice.city,
                  email: jInvoice.email,
                  phone: jInvoice.phone
               }
            }
            ajPreparedInvoices.push(jPreparedInvoice);
            console.log('pushed invoice', jPreparedInvoice, ajPreparedInvoices.length);
        }
      
    }
    return ajPreparedInvoices;
}

jFunctions.createError = (sCode, sDescription, sMessage, jError = {}) => {
    jError = {
        status: 'ERROR',
        errorCode: sCode,
        errorDescription: sDescription,
        errorMsg: sMessage,
        errorObj: jError
    }
    return jError
}

module.exports = jFunctions;