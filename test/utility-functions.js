const expect = require("chai").expect
const functions = require('../utilities/functions')

describe("Testing Utility Functions", function() {
   describe("Testing Email Validator", function() {
      it("Tries to validate an invalid email", function() {
         let result = functions.validateEmail('test.dk')
         expect(result).to.equal(false)
      });

      it("Tries to validate a valid email", function() {
         let result = functions.validateEmail('email@test.dk')
         expect(result).to.equal(true)
      });
   });

   describe("Testing Error Object Generator", function() {
      const sErrorStatus = 'ERROR'
      const sErrorNumber = 'ERRORNUMBER'
      const sErrorDescription = 'DESCRIPTION'
      const sErrorMessage = 'MESSAGE'
      const jErrorObject = { key: 'value' }

      it("Tries to generate an error without passing an error object", function() {
         let result = functions.createError(sErrorNumber, sErrorDescription, sErrorMessage)
         expect(typeof(result)).to.equal('object')
         expect(result.status).to.equal(sErrorStatus)
         expect(result.errorNumber).to.equal(sErrorNumber)
         expect(result.errorDescription).to.equal(sErrorDescription)
         expect(result.errorMsg).to.equal(sErrorMessage)
         expect(result.errorObj.key).to.equal(undefined)
      });

      it("Tries to generate an error with passing an error object", function() {
         let result = functions.createError(sErrorNumber, sErrorDescription, sErrorMessage, jErrorObject)
         expect(typeof(result)).to.equal('object')
         expect(result.status).to.equal(sErrorStatus)
         expect(result.errorNumber).to.equal(sErrorNumber)
         expect(result.errorDescription).to.equal(sErrorDescription)
         expect(result.errorMsg).to.equal(sErrorMessage)
         expect(result.errorObj.key).to.equal('value')
      });
   });

   describe("Testing Random String Generator", function() {
      it("Tries to generate a random string with a length of 10", function() {
         let result = functions.genRandomString(10)
         expect(result.length).to.equal(10)
      });

      it("Tries to generate a random string with a length of 20", function() {
         let result = functions.genRandomString(20)
         expect(result.length).to.equal(20)
      });

      it("Tries to generate a random string with a length of 128, allowing only upper case letters", function() {
         let result = functions.genRandomString(128, true)
         expect(result.length).to.equal(128)
         expect(result).to.equal(result.toUpperCase())
      });
   }); 
   
   describe("Testing Date Formatter Function", function() {
      const date = new Date('2018-12-31')
      it("Tries to format a date using the default format", function() {
         let result = functions.formatDate(date)
         expect(result).to.equal('31-12-2018')
      });

      it("Tries to format a date using a custom format", function() {
         let result = functions.formatDate(date, 'MM/DD/YYYY')
         expect(result).to.equal('12/31/2018')
      });
   });
});