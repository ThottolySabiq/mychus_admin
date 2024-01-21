const { promises } = require('nodemailer/lib/xoauth2');
const db = require('../db');

const createNewVendorService = (data) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO aqueon.services (serviceName, serviceType) VALUES (?, ?)';
    const values = [data.serviceObject.serviceName, data.serviceObject.serviceType];

    db.query(query, values, (error, results, fields) => {
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

// const getAllServices = () => {
//   return new Promise((resolve, reject) => {
//     const selectQuery = 'SELECT * FROM services';

//     db.query(selectQuery, (err, result) => {
//       if (err) {
//         console.error('Error retrieving services:', err);
//         reject(err);
//       } else {
//         console.log('Services retrieved successfully');
//         console.log('result', result);
//         resolve(result);
//       }
//     });
//   });
// };

const getAllServices = (vendorId) => {
  return new Promise((resolve, reject) => {
    try {
      // First query to get all services from the 'services' table
      const selectServicesQuery = 'SELECT * FROM aqueon.services';

      db.query(selectServicesQuery, (err, servicesResult) => {
        if (err) {
          console.error('Error retrieving services:', err);
          reject(err);
        } else {
          console.log('Services retrieved successfully');
          // console.log('Services result', servicesResult);


          // Second query to get service_ids for the given vendorId from 'vendor_services' table
          const selectVendorServicesQuery = 'SELECT service_id FROM aqueon.vendor_services WHERE vendor_id = ?';

          db.query(selectVendorServicesQuery, [vendorId], (err, vendorServicesResult) => {
            if (err) {
              console.error('Error retrieving vendor services:', err);
              reject(err);
            } else {
              const vendorServiceIds = vendorServicesResult.map((row) => row.service_id);

              // Combine the results of both queries
              const combinedResult = {
                services: servicesResult,
                vendorServices: vendorServiceIds,
              };

              resolve(combinedResult);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error retrieving services:', error);
      reject(error);
    }
  });
};

// const fetchServiceIdsMatchsVendorsId = (vendorId) => {

//   return new Promise((resolve, reject) => {
//     try {
//       const getServiceIdsQuery = 'SELECT service_id FROM vendor_services WHERE vendor_id = ?'

//       db.query(getServiceIdsQuery, [vendorId], (err, result) => {
//         if (err) {
//           console.error('Error retrieving services:', err);
//           reject(err);
//         } else {
//           console.log('Services retrieved successfully');
//           console.log('result', result);
//           resolve(result);
//         }
//       });
      
//     } catch (error) {
//       console.error('Error updating vendor services:', error);
//       reject(error);
//     }
//   });

// }

const fetchServicesMatchVendorAndIds = (vendorId, serviceIds, action) => {
  return new Promise((resolve, reject) => {
    try {

      // Generate placeholders for the service IDs
      const placeholders = serviceIds.map(() => '?').join(',');

      // Construct the query with dynamic number of placeholders
      const getServiceIdsQuery = `SELECT service_id FROM aqueon.vendor_services WHERE vendor_id = ? AND service_id IN (${placeholders})`;

      // Combine vendorId with serviceIds array for parameter values
      const queryValues = [vendorId, ...serviceIds];

      db.query(getServiceIdsQuery, queryValues, (err, result) => {
        if (err) {
          console.error('Error retrieving services:', err);
          reject(err);
        } else {
          console.log('Services retrieved successfully');
          console.log('fetchServicesMatchVendorAndIdsresult', result);

          // Extract existing service IDs from the result
          const existingServiceIds = result.map((row) => row.service_id);

          // Filter out service IDs that are not in the table
          const missingServiceIds = serviceIds.filter((id) => !existingServiceIds.includes(id));

          console.log('Missing service IDs:', missingServiceIds);
          
          resolve(missingServiceIds);
        }
      });

    } catch (error) {
      console.error('Error retrieving services:', error);
      reject(error);
    }
  });
};


// const addOrRemoveVendorServices = (vendorId, serviceIds) => {
//   return new Promise((resolve, reject) => {
//     try {
//       // Generate placeholders for the service IDs
//       const placeholders = serviceIds.map(() => '(?, ?)').join(',');

//       // Construct the multi-row INSERT query
//       const insertQuery = `INSERT INTO vendor_services (vendor_id, service_id) VALUES ${placeholders}`;

//       // Flatten the array of values for the query
//       const queryValues = serviceIds.flatMap((serviceId) => [vendorId, serviceId]);

//       console.log("queryValues", queryValues)

//       db.query(insertQuery, queryValues, (err, result) => {
//         if (err) {
//           console.error('Error adding vendor services:', err);
//           reject(err);
//         } else {
//           console.log('Vendor services added successfully');
//           resolve(result);
//         }
//       });
//     } catch (error) {
//       console.error('Error adding vendor services:', error);
//       reject(error);
//     }
//   });
// };
const addOrRemoveVendorServices = (vendorId, serviceIds, action) => {
  return new Promise((resolve, reject) => {
    try {
    
      if (action === 'add') {
        // Generate placeholders for the service IDs
        const placeholders = serviceIds.map(() => '(?, ?)').join(',');

        // Construct the multi-row INSERT query
        const insertQuery = `INSERT INTO aqueon.vendor_services (vendor_id, service_id) VALUES ${placeholders}`;

        // Flatten the array of values for the query
        const queryValues = serviceIds.flatMap((serviceId) => [vendorId, serviceId]);


        db.query(insertQuery, queryValues, (err, result) => {
          if (err) {
            console.error('Error adding vendor services:', err);
            reject(err);
          } else {
            console.log('Vendor services added successfully');
            resolve(result);
          }
        });
      } else if (action === 'remove') {
        // Construct the DELETE query
        const deleteQuery = 'DELETE FROM aqueon.vendor_services WHERE vendor_id = ? AND service_id IN (?)';

        // Flatten the array of values for the query
        const queryValues = [vendorId, serviceIds];

        console.log("queryValues", queryValues);

        db.query(deleteQuery, queryValues, (err, result) => {
          if (err) {
            console.error('Error removing vendor services:', err);
            reject(err);
          } else {
            console.log('Vendor services removed successfully');
            resolve(result);
          }
        });
      }
    } catch (error) {
      console.error('Error processing vendor services:', error);
      reject(error);
    }
  });
};

 
const updateVendorServices = async (vendorId, serviceIds) => {
  let removeServiceIds = []
  let addServiceIds = []
  // Object.keys(serviceIds).forEach(element => {
  //   if(serviceIds[element]) {
  //     addServiceIds.push(parseInt(element))
  //   } else {
  //     removeServiceIds.push(parseInt(element))
  //   }
  // })

  for (let element in serviceIds) {
    if (serviceIds.hasOwnProperty(element)) {
      if (serviceIds[element]) {
        addServiceIds.push(parseInt(element));
      } else {
        removeServiceIds.push(parseInt(element));
      }
    }
  }



  const serviceIdsArray = Object.keys(serviceIds).map(Number);
  console.log(serviceIdsArray);

  
  if(addServiceIds.length > 0) {
    const servicesArrToadd = await fetchServicesMatchVendorAndIds(vendorId, addServiceIds, 'add')
    if (servicesArrToadd.length > 0) {      
      const addServicesArr = await addOrRemoveVendorServices(vendorId, serviceIdsArray, 'add')

    }
  }


  if(removeServiceIds.length > 0) {
    // const servicesArrToremove = await fetchServicesMatchVendorAndIds(vendorId, removeServiceIds, 'remove')
    const removeServicesArr = await addOrRemoveVendorServices(vendorId, removeServiceIds, 'remove')
     
  }
  

  // const seviceIdsArray = await fetchServicesMatchVendorAndIds(vendorId, serviceIdsArray)

      // if(seviceIdsArray.length > 0) {
      //   await addVendorServices(vendorId, serviceIdsArray)
      // }

};



// const addnewService = (serviceData) => {

//     const { serviceName, serviceType } = serviceData;

//     const insertQuery = `
//     INSERT INTO services (serviceName, serviceType)
//     VALUES (?, ?)
//   `;

//   db.query(insertQuery, [serviceName, serviceType], (err, result) => {
//     if (err) {
//       console.error('Error adding service:', err);
//     } else {
//       console.log('Service added successfully');
//     }
//   });
// }

const addNewService = (serviceData) => {
  return new Promise((resolve, reject) => {
    const { serviceName, serviceType } = serviceData;

    const insertQuery = `
      INSERT INTO aquoen.services (serviceName, serviceType)
      VALUES (?, ?)
    `;

    db.query(insertQuery, [serviceName, serviceType], (err, result) => {
      if (err) {
        console.error('Error adding service:', err);
        reject(err);
      } else {
        console.log('Service added successfully');
        resolve(result);
      }
    });
  });
};

module.exports = { addNewService, getAllServices, updateVendorServices, createNewVendorService };
