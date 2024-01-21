const db = require('../db');
const nodemailer = require("nodemailer");
const { getHtmlForVendorServiceRequest } = require('./email');

const transporter = nodemailer.createTransport({
    host: "mail.aqueongroup.com",
    port: 465,
    secure: true,
    auth: {
        user: 'alerts@aqueongroup.com',
        pass: 'Aqueon@123'
    }
});

const updateVendorCertificates = (filename, vendorId, detailsArray) => {
    console.log("detailsArray", detailsArray);
    const sql = 'INSERT INTO aqueon.vendors_certificates (filename, vendor, type, name, validity) VALUES (?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        db.query(sql, [filename, vendorId, detailsArray[0], detailsArray[1], detailsArray[2]], (err, results) => {
            resolve(results);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        });
    })
}

const updateAdminAprovalStatus = (requestId,addedCost) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE aqueon.requested_vendors
                 SET
                 adminApprovedStatus = ?,
                 addedCost = ?
                 WHERE id = ?
                `
        db.query(sql, ['approved', addedCost, requestId], (error, result) => {
            if (error) {
                reject(error)
            } else {
                resolve(result)
            }
        })
    })
}

// const addVendorAcceptedService = (requestData, userId) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             // Destructure values from the request data
//             const { currencyType, serviceCost, mobilizationCost, extraCharges, totalCost, requestId, extraChargeRemark, termsAndCondition } = requestData;

//             const sql = `
//           UPDATE aqueon.requested_vendors 
//           SET 
//             serviceCost = ?, 
//             status = ?, 
//             currency = ?, 
//             mobilizationCost = ?, 
//             adminApprovedStatus = ?, 
//             extraCharges = ?, 
//             totalCost = ?, 
//             extraChargeRemark = ?, 
//             termsAndCondition = ?
//           WHERE requestId = ? AND vendorId = ?`;

//             db.query(sql, [
//                 serviceCost,
//                 'Accepted',
//                 currencyType,
//                 mobilizationCost,
//                 'pending', // Assuming this should be 'pending'
//                 extraCharges,
//                 totalCost,
//                 extraChargeRemark,
//                 termsAndCondition,
//                 requestId,
//                 userId,
//             ], (error, result) => {
//                 if (error) {
//                     console.error("Error adding vendor accepted service:", error);
//                     reject(error);
//                 } else {
//                     resolve(result);
//                 }
//             });

//         } catch (error) {
//             console.error("Error adding vendor accepted service:", error);
//             reject(error);
//         }
//     });
// };

const addVendorAcceptedService = (requestData, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Destructure values from the request data
            let { currencyType, serviceCost, mobilizationCost, extraCharges, totalCost, requestId, extraChargeRemark, termsAndCondition } = requestData;
            serviceCost = JSON.stringify(serviceCost)
            const sql = `
          UPDATE aqueon.requested_vendors 
          SET 
            adminApprovedStatus = CASE 
                                    WHEN addedCost IS NOT NULL THEN 'approved'
                                    ELSE 'pending'
                                END,
            serviceCost = ?, 
            status = ?, 
            currency = ?, 
            mobilizationCost = ?, 
            extraCharges = ?, 
            totalCost = ?, 
            extraChargeRemark = ?, 
            termsAndCondition = ?
          WHERE requestId = ? AND vendorId = ?`;

            db.query(sql, [
                serviceCost,
                'Accepted',
                currencyType,
                mobilizationCost,
                extraCharges,
                totalCost,
                extraChargeRemark,
                termsAndCondition,
                requestId,
                userId,
            ], (error, result) => {

                // Check if addedCost is not null for the given requestId
                // const checkAddedCostQuery = `
                // SELECT addedCost FROM aqueon.requested_vendors 
                // WHERE requestId = ? AND addedCost IS NOT NULL
                // LIMIT 1`;

                // db.query(checkAddedCostQuery, [requestId], async (error, result) => {
                //     if (error) {
                //         console.error("Error checking addedCost:", error);
                //         reject(error);
                //         return;
                //     }

                //     const addedCost = result.length > 0 ? result[0].addedCost : null;

                //     // Update query with conditional addedCost update
                //     const updateQuery = `
                //     UPDATE aqueon.requested_vendors 
                //     SET 
                //         serviceCost = ?, 
                //         status = ?, 
                //         currency = ?, 
                //         mobilizationCost = ?, 
                //         adminApprovedStatus = ?, 
                //         extraCharges = ?, 
                //         totalCost = ?, 
                //         extraChargeRemark = ?, 
                //         termsAndCondition = ?,
                //         addedCost = COALESCE(?, addedCost)  -- Set addedCost only if it is not null
                //     WHERE requestId = ? AND vendorId = ?`;

                //     db.query(
                //         updateQuery,
                //         [
                //             serviceCost,
                //             'Accepted',
                //             currencyType,
                //             mobilizationCost,
                //             'pending', // Assuming this should be 'pending'
                //             extraCharges,
                //             totalCost,
                //             extraChargeRemark,
                //             termsAndCondition,
                //             addedCost,  // Pass the value of addedCost here
                //             requestId,
                //             userId,
                //         ],
                //         (updateError, updateResult) => {
                //             if (updateError) {
                //                 console.error("Error updating vendor accepted service:", updateError);
                //                 reject(updateError);
                //             } else {
                                resolve(true);
                //             }
                //         }
                //     );
                // });
            })
            } catch (error) {
                console.error("Error adding vendor accepted service:", error);
                reject(error);
            }
        });
};

const getVendorCertificates = (vendorId) => {
    const sql = 'SELECT filename, type, name, validity FROM aqueon.vendors_certificates WHERE vendor = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [vendorId], (err, results) => {
            console.log("results", results)
            if (err) {
                console.error('Error fetching data:', err);
                reject(err);
            } else {
                const formattedResults = results.map(result => ({
                    name: result.name,
                    type: result.type,
                    filename: result.filename,
                    validity: result.validity
                }));
                resolve(formattedResults);
            }
        });
    });
};

const getShipOwnerDetials = (email) => {
    const sql = 'SELECT * FROM aqueon.ship_owners WHERE company_email = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [email], (err, results) => {
            resolve(results);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        });
    })
}


const checkCertifcateExpired = (data) => {
    const expiredCheck = data.map(each => {
        const dateString = each.filename.split('|')[2].split('-');
        dateString.pop()
        const inputDate = new Date(dateString.join("-"));
        const today = new Date();
        if (inputDate < today) {
            each.expired = true;
        } else if (inputDate > today) {
            each.expired = false;
            console.log("The input date is in the future.");
        } else {
            each.expired = true;
        }
        return each
    })
    return expiredCheck;
}

const getVendorsDetials = (email) => {
    const sql = 'SELECT * FROM aqueon.vendors WHERE company_email = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [email], (err, results) => {
            resolve(results);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        });
    })
}

const updateProfileInfo = (profileInfo, filename, userId) => {
    const fileNameToSave = filename ? filename : null;
    const { companyName, country, staff, contactNumber, personalEmail, companyEmail, websites, companyDescription } = profileInfo;
    const sql = `UPDATE aqueon.vendors SET company_name = ?, country = ?, 
                 staff = ?, contact_number = ?, personal_email = ?, company_email = ?, 
                 website = ?, companyDescriptions = ?, companyBrochures = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.query(sql, [companyName, country, staff, contactNumber, personalEmail, companyEmail, websites, companyDescription, fileNameToSave, userId],
            (err, result) => {
                if (err) {
                    console.log('err', err)
                    reject(err)
                }
                if (result.affectedRows === 0) {
                    reject('Vendor not found')
                } else {
                    resolve('Approval status updated successfully')
                }
            });
    })
}

const updateServiceLocation = (serviceLoation, vendor) => {
    console.log('serviceLoation', serviceLoation);
    const sql = 'INSERT INTO aqueon.vendor_service_location (country, port, vendor) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
        db.query(sql, [serviceLoation.country, serviceLoation.port, vendor], (err, result) => {
            resolve(true);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const addDataToRequestVendors = (vendorId, requestId) => {
    const sql = 'INSERT INTO aqueon.requested_vendors (vendorId, requestId, status) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
        db.query(sql, [vendorId, requestId, 'pending'], (err, result) => {
            resolve(true);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const fetchPendingRequest = (vendorId) => {
    const sql = `SELECT * FROM aqueon.requested_vendors WHERE vendorId = ?`;
    return new Promise((resolve, reject) => {
        db.query(sql, [vendorId], (err, result) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

const fetchVendorsAccepetedRequestes = (id) => {
    const sql = `SELECT 
                vendors.company_name,
                vendors.company_email, 
                requested_vendors.id,
                requested_vendors.requestId,
                requested_vendors.price,            
                requested_vendors.status,
                requested_vendors.currency,
                requested_vendors.remark,
                requested_vendors.serviceCost, 
                requested_vendors.mobilizationCost, 
                requested_vendors.adminApprovedStatus, 
                requested_vendors.extraCharges, 
                requested_vendors.addedCostMethod, 
                requested_vendors.totalCost, 
                requested_vendors.extraChargeRemark, 
                requested_vendors.termsAndCondition,
                requested_vendors.addedCost
                FROM 
                vendors,
                requested_vendors
                WHERE requested_vendors.requestId=${id} and vendors.id = requested_vendors.vendorId;`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            resolve(result);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}


const getVendorInfoWithServiceLocation = (vendorId) => {
    const sql = `SELECT
        vendors.id,
        vendors.company_name,
        vendors.company_email,
        vendors.contact_number,
        vendors.personal_email,
        vendors.country,
        vendors.company_email,
        vendors.website,
        vendors.companyDescriptions,
        vendors.companyBrochures,
        vendors.staff,
        vendor_service_location.country as service_location_country,
        vendor_service_location.port
        FROM vendors, aqueon.vendor_service_location WHERE vendors.id = ${vendorId} and aqueon.vendor_service_location.vendor = ${vendorId};`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            resolve(result);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const getVendorInfo = (vendorId) => {
    const sql = `SELECT id, company_name, company_email, contact_number, personal_email, country, company_email, website, companyDescriptions, companyBrochures, staff
        FROM aqueon.vendors WHERE id = ${vendorId};`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            resolve(result);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const checkServiceLocationForVendor = (vendorId) => {
    const sql = `SELECT * FROM aqueon.vendor_service_location WHERE vendor=${vendorId}`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            resolve(result);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const groupServiceLocation = (data) => {
    let vendorProfileDetails = data[0]
    let serviceLocation;
    if (vendorProfileDetails && vendorProfileDetails.service_location_country) {
        serviceLocation = data.map(each => { return { country: each.service_location_country, port: each.port, saved: true } })
        delete vendorProfileDetails.port
        delete vendorProfileDetails.service_location_country
        vendorProfileDetails.serviceLocation = serviceLocation
    }
    return vendorProfileDetails
}

const getServiceName = (serivceId) => {
    const sql = `SELECT serviceName FROM aqueon.services WHERE id=${serivceId}`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            resolve(result[0] ? result[0] : {});
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const getAddedCostFromServiceRequest = (requestId) => {
    const sql = `SELECT addedCost FROM aqueon.service_request WHERE id=${requestId}`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            resolve(result[0] ? result[0] : {});
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const getSelectedVendorsForRequest = (serviceId, country) => {
    const sql = `SELECT
    vendors.country,
    vendor_services.service_id,  
    vendor_services.vendor_id  
    FROM vendors, vendor_services WHERE vendor_services.service_id = ? and vendors.country = ? group by vendor_id;`;
    return new Promise((resolve, reject) => {
        db.query(sql, [serviceId, country], (err, result) => {
            resolve(result);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const sendEmailToVendor = async (companyEmail, companyName, requestId, serviceName) => {
    console.log("companyEmail", companyEmail);
    const d = new Date();
    let dateString = d.toLocaleString();
    const info = await transporter.sendMail({
        from: '"aqueon group alert" <alerts@aqueongroup.com>', // sender address
        to: 'aqueongroup@gmail.com', // list of receivers
        subject: "Successfully registiered", // Subject line
        html: getHtmlForVendorServiceRequest(companyName, requestId, serviceName, dateString)
    });
    console.log("info", info)
}



module.exports = {
    getVendorCertificates, checkCertifcateExpired, updateVendorCertificates, updateAdminAprovalStatus, getVendorInfoWithServiceLocation, getVendorsDetials, addVendorAcceptedService, checkServiceLocationForVendor, updateProfileInfo, updateServiceLocation, getVendorInfo, groupServiceLocation,
    getShipOwnerDetials, getSelectedVendorsForRequest, sendEmailToVendor, getServiceName, addDataToRequestVendors, fetchPendingRequest, fetchVendorsAccepetedRequestes,
    getAddedCostFromServiceRequest

};