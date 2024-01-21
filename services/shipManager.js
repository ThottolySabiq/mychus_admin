const db = require('../db');

const getShipOwnerDetials = (email) => {
    const sql = 'SELECT id, company_name, company_email, create_time, contact_number, country, active FROM aqueon.ship_owners WHERE company_email = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [email], (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
            resolve(results[0] ? results[0] : {});
        });
    })
}

const getShipOwners = (email) => {
    const sql = 'SELECT * FROM aqueon.ship_owners';
    return new Promise((resolve, reject) => {
        db.query(sql, [email], (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
            resolve(results);
        });
    })
}


const getShipOwnerDetialsByID = (id) => {
    const sql = 'SELECT id, company_name, company_email, create_time, contact_number, country, active FROM aqueon.ship_owners WHERE id = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
            resolve(results[0] ? results[0] : {});
        });
    })
}

const addNewRequest = (requestDetails) => {
    const sql = 'INSERT INTO aqueon.service_request (ship_manager, service_id, country, port, ship_details, status, other_service) VALUES (?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        db.query(sql, [requestDetails.shipManagerId, requestDetails.serviceId, requestDetails.country, requestDetails.port, requestDetails.shipDetails, requestDetails.status, requestDetails.otherService], (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
            resolve(results);
        });
    })
}

const fetchShipDetails = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT service_request.ship_details, service_request.addedCost FROM service_request where service_request.id=${id};`;
        db.query(sql, (err, result) => {
            if (err) {
                reject(err);
            }
            console.log("result", result);
            resolve(result);
        });
    });
}

const fetchServiceRequestsByShipManager = (id) => {
    const sql = `SELECT service_request.id, service_request.country, service_request.create_time, service_request.port, service_request.status, services.serviceName FROM service_request, services WHERE service_request.ship_manager =${id} and services.id = service_request.service_id;`;
    return new Promise((resolve, reject) => {
        // const sql = `SELECT * FROM service_request where service_request.ship_manager=${id};`;
        db.query(sql, (err, result) => {
            if (err) {
                reject(err);
            }
            console.log("result", result);
            resolve(result);
        });
    });
}

const fetchServiceRequestsWithOtherSerivceByShipManager = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT service_request.id, service_request.country, service_request.create_time, service_request.port, service_request.status, service_request.other_service as newServiceName FROM service_request where service_request.ship_manager = ${id} and service_id='-1';`;
        db.query(sql, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};


const fetchServiceRequests = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT service_request.id, service_request.country, service_request.create_time, service_request.port, service_request.status, ship_owners.company_email, ship_owners.company_name, services.serviceName FROM service_request, ship_owners, services WHERE service_request.ship_manager = ship_owners.id and services.id = service_request.service_id;`;
        db.query(sql, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};

const fetchServiceRequestsWithOtherSerivce = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT service_request.id, service_request.country, service_request.create_time, service_request.port, service_request.status, service_request.other_service as newServiceName, ship_owners.company_email, ship_owners.company_name FROM service_request, ship_owners where service_request.ship_manager = ship_owners.id and service_id='-1';`;
        db.query(sql, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};

const addExtraCostServiceRequest = (addedCost, requestId) => {
    const sql = `UPDATE aqueon.requested_vendors SET addedCost = ?, adminApprovedStatus='approved', addedCostMethod='auto' WHERE requestId = ?`;
    return new Promise((resolve, reject) => {
        db.query(sql, [addedCost, requestId], (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
            resolve(results[0]);
        }); 
    })
}

const addExtraCostServiceRequestToServiceRequest = (requestId) => {
    const sql = 'UPDATE aqueon.service_request SET addedCost = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, ['true', requestId], (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
            resolve(results[0]);
        }); 
    })
}

const getShipManagerIdFromRequetId = (requestId) => {
    const sql = 'SELECT ship_manager, addedCost FROM aqueon.service_request WHERE id = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [requestId], (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
            resolve(results[0]);
        }); 
    })
}

const requestesVendors = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT vendors.company_name, vendors.company_email, requested_vendors.status, requested_vendors.offerAwareded FROM vendors, requested_vendors WHERE requested_vendors.requestId=${id} and vendors.id = requested_vendors.vendorId;`;
        db.query(sql, (err, result) => {
            resolve(result);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        })
    })
}

const closeAllTheRequestVendors = (id) => {
    const sql = `UPDATE aqueon.requested_vendors SET status='closed', closed_time = CURRENT_TIMESTAMP WHERE requestId = ${id}`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error updating data:', err);
                reject(err)
            }
            resolve(result);
        })
    })
}

const updateRequestedVendorOfferAwareded = (id) => {
    const sql = `UPDATE aqueon.requested_vendors SET offerAwareded='true', status='offerAwareded' WHERE id = ${id}`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error updating data:', err);
                reject(err)
            }
            resolve(result);
        })
    })
}

const updateServiceRequest = (id) => {
    const sql = `UPDATE aqueon.service_request SET status='offerAwareded' WHERE id = ${id}`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error updating data:', err);
                reject(err)
            }
            resolve(result);
        })
    })
}

const requestesVendorsForVendor = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT 
        vendors.id as vendorId,
        vendors.company_name, 
        vendors.company_email, 
        requested_vendors.id,
        requested_vendors.status,
        requested_vendors.currency,
        requested_vendors.remark,
        requested_vendors.offerAwareded,
        requested_vendors.serviceCost,
        requested_vendors.addedCost,
        requested_vendors.adminApprovedStatus,
        requested_vendors.addedCostMethod,
        requested_vendors.mobilizationCost,
        requested_vendors.extraCharges,
        requested_vendors.totalCost,
        requested_vendors.extraChargeRemark,
        requested_vendors.termsAndCondition,
        extraChargeRemark
        FROM 
        vendors, 
        requested_vendors 
        WHERE 
        requested_vendors.requestId=${id} and vendors.id = requested_vendors.vendorId and requested_vendors.adminApprovedStatus='approved' and requested_vendors.serviceCost IS NOT NULL;`;
        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
            resolve(result);
        })
    })
}

const getServiceByID = (serviceId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT serviceName FROM services WHERE id=${serviceId};`;
        db.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results[0] ? results[0] : {});
        });
    });
};

const getPendingEnquiresCount = (shipManagerId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id FROM service_request WHERE ship_manager=${shipManagerId} and status='pending';`;
        db.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
};

const getOfferAwaredEnquires = (shipManagerId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id FROM service_request WHERE ship_manager=${shipManagerId} and status='offerAwareded';`;
        db.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
};


const getAllRequestIdFor = (reqIdArr) => {
    const reqIdArrNumbers = reqIdArr.map(x => x.id);
    console.log("reqIdArrNumbers", reqIdArrNumbers)
    const placeholders = reqIdArrNumbers.join(',');
    console.log('placeholders', placeholders)
    const sql = `SELECT id, requestId FROM requested_vendors WHERE requestId IN (${placeholders}) and serviceCost IS NOT NULL;`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
};

module.exports = {
    getShipOwnerDetials,
    addNewRequest,
    fetchServiceRequests,
    getShipOwnerDetialsByID,
    getServiceByID,
    fetchShipDetails,
    requestesVendors,
    fetchServiceRequestsWithOtherSerivce,
    addExtraCostServiceRequest,
    fetchServiceRequestsByShipManager,
    fetchServiceRequestsWithOtherSerivceByShipManager,
    requestesVendorsForVendor,
    updateRequestedVendorOfferAwareded,
    updateServiceRequest,
    closeAllTheRequestVendors,
    getPendingEnquiresCount,
    getAllRequestIdFor,
    getOfferAwaredEnquires,
    getShipOwners,
    getShipManagerIdFromRequetId,
    addExtraCostServiceRequestToServiceRequest
}