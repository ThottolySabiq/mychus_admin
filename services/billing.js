const db = require('../db');

const addBillingData = (data) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO aqueon.billing_address SET ?';
    db.query(query, data, (error, results, fields) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        console.log('Data inserted successfully!');
        resolve(results);
      }
    });
  });
};

const updateBillingAddress = (data,vendor_id) => {
  console.log("vendor_id", vendor_id)
  return new Promise((resolve, reject) => {
    const sql = `UPDATE aqueon.billing_address SET companyName = ?, emailId = ?, 
    contactNumber = ?, address = ?, country = ?, postalCode = ?, 
    branchName = ?, taxVat = ?, ifscCode = ?, accountNumber = ? WHERE vendorId=${vendor_id}`;
    db.query(sql, [data.companyName, data.emailId, data.contactNumber, data.address, data.country, data.postalCode, data.branchName, data.taxVat, data.ifscCode, data.accountNumber], (error, results, fields) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        console.log('Data inserted successfully!');
        resolve(results);
      }
    });
  });
}

const getBillingDetails = (vendorId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM aqueon.billing_address WHERE vendorId = ?';

    db.query(query, vendorId, (error, results, fields) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = { addBillingData, getBillingDetails, updateBillingAddress };
