const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { hashPassword, generatePassword, sendOfferMailToShipOwner, sendEmailToSupplier, sendEmailToAdmin, getSaltAndPassWordFromVendor, updatePassword, vendorSignup, verifyToken, generateVendorCode, generateShipOwnerCode, shipOwnerSignup, fetchServiceRequestsByIds, fetchCombinedDataWithShipCode, fetchServiceDataById } = require('../services/auth');
const { addnewService, getAllServices, updateVendorServices, createNewVendorService, } = require('../services/vendorService')
const { updateVendorCertificates, updateProfileInfo, updateServiceLocation, getVendorInfo, groupServiceLocation, checkServiceLocationForVendor, getVendorInfoWithServiceLocation, getVendorsDetials, getVendorCertificates, checkCertifcateExpired, getSelectedVendorsForRequest, sendEmailToVendor, getServiceName, addDataToRequestVendors, fetchPendingRequest, addVendorAcceptedService, fetchVendorsAccepetedRequestes, updateAdminAprovalStatus, getAddedCostFromServiceRequest } = require('../services/vendor');
const { addBillingData, getBillingDetails, updateBillingAddress } = require('../services/billing')
const { getShipOwnerDetials, addNewRequest, fetchServiceRequests, getShipOwnerDetialsByID, getServiceByID, requestesVendors, fetchShipDetails, fetchServiceRequestsWithOtherSerivce, addExtraCostServiceRequest, fetchServiceRequestsByShipManager, fetchServiceRequestsWithOtherSerivceByShipManager, requestesVendorsForVendor, updateRequestedVendorOfferAwareded, updateServiceRequest, closeAllTheRequestVendors, getPendingEnquiresCount, getAllRequestIdFor, getOfferAwaredEnquires, getShipOwners, getShipManagerIdFromRequetId, addExtraCostServiceRequestToServiceRequest } = require('../services/shipManager')
const {sendInviteEmailToVendors} = require('../services/index')

const BUCKET = 'cyclic-magnificent-gray-ox-eu-west-3';
const AWS = require('aws-sdk');

// AWS.config.update({
//   accessKeyId: 'your_access_key_id',
//   secretAccessKey: 'your_secret_access_key',
//   region: 'your_bucket_region',
// });

const s3 = new AWS.S3();

const secretKey = '$@h4Dqlo-Qsz';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // limit file size to 5MB
    }
});

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Uploads will be stored in the 'uploads/' directory.
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     },
// });

// const upload = multer({ storage });

router.post('/admin/add-product', upload.any('files'), async (req, res) => {
    try {
        // const vendorId = req.user.userId;
        console.log("req.files", req.files);
        for (let each of req.files) {
            console.log("each", each);
            let key = each.fieldname + '-' + Date.now() + path.extname(each.originalname)
            console.log(key)
            const params = {
                Bucket: BUCKET,
                Key: key,
                Body: each.buffer,
            };
            await s3.upload(params).promise();
            const fileNameArray = each.fieldname.split('|');
            console.log("fileNameArray", fileNameArray);
            await updateVendorCertificates(key, vendorId, fileNameArray)
        }
        return res.status(200).json({ message: 'Sucessfully uploaded' });
    } catch (err) {
        console.log("err", err)
        return res.status(500).json({ message: 'Server error' });
    }
})


// router.post('/add-product', verifyToken, async(req, res) => {
//     try{
//         sendInviteEmailToVendors(req.body)
//         return res.status(200).json({ message: "requested sucessfully" });
//     } catch (err) {
//         return res.status(500).json({ message: 'Server error' });
//     }
// })

router.post('/vendor-quote', verifyToken, async (req, res) => {
    try {
        const { data } = req.body;
        console.log("data", data)
        const userId = req.user.userId;
        await addVendorAcceptedService(data, userId);
        const shipOwner = await getShipManagerIdFromRequetId(data.requestId)
        if (shipOwner.addedCost) {
            const { company_email, company_name } =  await getShipOwnerDetialsByID(shipOwner.ship_manager);
            await sendOfferMailToShipOwner(company_email, company_name)
        }
        return res.status(200).json({ message: 'Data inserted successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error sending vendor quote.' });
    }
});

router.post('/upload-billing-details', verifyToken, async (req, res) => {
    try {
        const data = req.body.inputData
        console.log("datankjn", data);
        await updateBillingAddress({ ...data, vendorId: req.user.userId }, req.user.userId)
        res.status(200).json({ message: ' Adding billing details failed' });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: ' Adding billing details failed' });
    }
})

router.post('/signup', async (req, res) => {
    try {
        const { companyName, contactNumber, companyEmail, Country, userType } = req.body.formData
        let password = generatePassword();
        const salt = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await hashPassword(password, salt);
        console.log("userType", userType)
        if (userType === 'shipManager') {
            const checkShipOwnerEmailUsed = await getShipOwnerDetials(companyEmail);
            if (checkShipOwnerEmailUsed && checkShipOwnerEmailUsed.length) {
                res.status(400).json({ message: "User with the same email already exists" });
                return;
            }
            const shipOwnerCode = await generateShipOwnerCode(companyName);
            const shipOwnerDetails = {
                ...req.body.formData, hashedPassword, salt, shipOwnerCode
            }
            await shipOwnerSignup(shipOwnerDetails);
        } else {
            const checkVendorEmailUsed = await getVendorsDetials(companyEmail);
            if (checkVendorEmailUsed && checkVendorEmailUsed.length) {
                res.status(400).json({ message: "User with the same email already exists" });
                return;
            }
            const vendorCode = await generateVendorCode(companyName);
            const vendorDetails = {
                ...req.body.formData, hashedPassword, salt, vendorCode
            }
            const { insertId } = await vendorSignup(vendorDetails)
            await addBillingData({ vendorId: insertId })
        }
        sendEmailToSupplier(companyEmail, password);
        sendEmailToAdmin(companyName, companyEmail, contactNumber, Country, userType);
        res.status(200).json({ message: "Successfully registered vendor" });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Vendor registration failed' });
    }
});

router.post('/create-new-vendor-service', verifyToken, async (req, res) => {
    try {
        const data = req.body
        await createNewVendorService(data)
        res.status(200).json({ message: 'Successfully updated' });
    } catch (err) {
        res.status(500).json({ message: 'server error' });
    }
})

router.post('/add-vendor-service', verifyToken, async (req, res) => {
    try {
        updateVendorServices(req.user.userId, req.body.data.serviceIds)
            .then((result) => {
                res.status(200).json({ message: 'Successfully updated' });
            })
            .catch((error) => {
                res.status(500).json({ message: 'server error' });
            });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'server error' });
    }
})

router.get('/vendors', verifyToken, async (req, res) => {
    const sql = 'SELECT * FROM vendors';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ message: 'Error fetching data' });
            return;
        }
        res.status(200).json(results);
    });
})

router.get('/admin/vendors', verifyToken, async (req, res) => {
    const sql = 'SELECT id, company_name, company_email, contact_number, country, creation_time, approval_status, personal_email, staff, website FROM vendors';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ message: 'Error fetching data' });
            return;
        }
        res.status(200).json(results);
    });
})

router.post('/admin/login', (req, res) => {
    try {
        const { email, password } = req.body
        if (email === 'admin@2023' && password === 'aqueon@2023') {
            const token = jwt.sign({ username: 'admin@2023', userType: 'admin' }, secretKey);
            res.status(200).json({ data: { email, userType: 'admin', token } });
        } else {
            res.status(401).json("auth failed")
        }
    } catch {
        res.status(500).json({ message: 'server errror' });
    }
})

router.get('/vendors/billing-addres', verifyToken, async (req, res) => {
    try {
        let userId = req.query.vendorId
        if(!userId){
            userId = req.user.userId
        }
        const billingDetails = await getBillingDetails(userId)
        return res.status(200).json({ data: billingDetails });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.put('/vendors/profile/info', verifyToken, upload.single('file'), async (req, res) => {
    try {
        console.log("req.body", req.body);
        console.log("req.file", req.file);
        let key;
        if (req.file) {
            key = req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname)
            const params = {
                Bucket: BUCKET,
                Key: key,
                Body: req.file.buffer,
            };
            await s3.upload(params).promise();
        }
        console.log("key", key);
        console.log("req.user.userId", req.user.userId);
        await updateProfileInfo(req.body, key, req.user.userId)
        const serviceLocations = JSON.parse(req.body.serviceLocation)
        console.log("serviceLocations", req.body.serviceLocation);
        serviceLocations.forEach(async (eachLocation) => await updateServiceLocation(eachLocation, req.user.userId));
        res.status(200).json({ message: 'Approval status updated successfully' });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error updating approval status' });
    }
});

router.get('/shipmanager/info', verifyToken, async (req, res) => {
    try {
        const shipManagerDetails = await getShipOwnerDetials(req.user.username);
        return res.status(200).json({ data: shipManagerDetails });
    } catch (err) {
        console.log("err", err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/admin/shipmanager', verifyToken, async (req, res) => {
    try {
        const shipManagerDetails = await getShipOwners();
        return res.status(200).json({ data: shipManagerDetails });
    } catch (err) {
        console.log("err", err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/shipmanager/status', verifyToken ,async (req, res) => {
    try {
        const { userId } = req.user;
        console.log("userId", userId);
        const pendingEnquiresRequestsIds = await getPendingEnquiresCount(userId)
        const offerAwardedRequestsIds = await getOfferAwaredEnquires(userId)
        console.log("pendingEnquiresRequestsIds", pendingEnquiresRequestsIds);
        if (!pendingEnquiresRequestsIds.length) {
            return res.status(200).json({ data: { pendingEnquiresRequestsIds: [], newOfferIds: [], offerAwardedRequestsIds } });
        }
        const newOfferIds = await getAllRequestIdFor(pendingEnquiresRequestsIds)
        console.log("newOfferIds", newOfferIds);    
        return res.status(200).json({ data: { pendingEnquiresRequestsIds, newOfferIds, offerAwardedRequestsIds } });
    } catch (err) {
        console.log("err", err)
        return res.status(500).json({ message: 'Server error' });
    }
})


router.post('/vendors/login', async (req, res) => {
    try {
        const { email, password, userType } = req.body;
        console.log("userType", userType)
        const { id, company_email, salt, password: storedPassword, code, company_name } = await getSaltAndPassWordFromVendor(email, userType);
        console.log("company_email", company_email);
        if (company_email !== email) { return res.status(401).json({ message: 'Invalid username' }) }

        const hashedInputPassword = await hashPassword(password, salt);
        if (hashedInputPassword !== storedPassword) { return res.status(401).json({ message: 'Invalid password' }) }
        const token = jwt.sign({ username: company_email, userId: id, vendorCode: code, userType, company_name }, secretKey);

        return res.status(200).json({ data: { token, email, id, code, userType, company_name } });
    } catch (err) {
        console.log("err", err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/fetch-vendor-certificates', verifyToken, async (req, res) => {
    try {
        let userId = req.query.vendorId
        if(!userId){
            userId = req.user.userId
        }
        const data = await getVendorCertificates(userId)
        const checkExpiredSert = await checkCertifcateExpired(data);
        return res.status(200).json(checkExpiredSert);
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });

    }
})

router.post('/vendors/profile/certificates', verifyToken, upload.any('files'), async (req, res) => {
    try {
        const vendorId = req.user.userId;
        console.log("req.files", req.files);
        for (let each of req.files) {
            console.log("each", each);
            let key = each.fieldname + '-' + Date.now() + path.extname(each.originalname)
            console.log(key)
            const params = {
                Bucket: BUCKET,
                Key: key,
                Body: each.buffer,
            };
            await s3.upload(params).promise();
            const fileNameArray = each.fieldname.split('|');
            console.log("fileNameArray", fileNameArray);
            await updateVendorCertificates(key, vendorId, fileNameArray)
        }
        return res.status(200).json({ message: 'Sucessfully uploaded' });
    } catch (err) {
        console.log("err", err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.post('/vendors/changepassword', verifyToken, async (req, res) => {
    try {
        const { password } = req.body;
        console.log("password", password);
        const salt = crypto.randomBytes(16).toString('hex');
        console.log("salt", salt);
        const hashedPassword = await hashPassword(password, salt);
        await updatePassword(hashedPassword, req.user.userId, salt);
        return res.status(200).json({ message: 'Password changed' });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/vendors/profile/info', verifyToken, async (req, res) => {
    try {
        let userId = req.query.vendorId
        if(!userId){
            userId = req.user.userId
        }
        const isServiceLoction = await checkServiceLocationForVendor(userId);
        let vendorDetails;
        if (!isServiceLoction.length) {
            vendorDetails = await getVendorInfo(userId);
        } else {
            vendorDetails = await getVendorInfoWithServiceLocation(userId);
        }
        const vendorDetailsWithServiceLocation = groupServiceLocation(vendorDetails)
        return res.status(200).json({ message: vendorDetailsWithServiceLocation });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/vendor/service-location', async (req, res) => {
    try {
        console.log("req.params", req);
        const { vendorId } = req.query
        const isServiceLoction = await checkServiceLocationForVendor(vendorId);
        if (!isServiceLoction.length) {
            return res.status(200).json({ message: "No Service Location Added" });
        } else {
            return res.status(200).json({ message: isServiceLoction });
        }
    } catch (err) {
        console.log("err", err)
        return res.status(500).json({ message: 'Server error' });
    }
})


router.get('/vendor/download-certificate/:filename', verifyToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const params = {
            Bucket: BUCKET,
            Key: filename,
        };
        const fileStream = s3.getObject(params).createReadStream();
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        fileStream.pipe(res);
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.post('/service-request', verifyToken, async (req, res) => {
    try {
        const { serviceId, country, port, shipDetails, otherService } = req.body
        let requestDetails = {
            shipManagerId: req.user.userId,
            serviceId,
            country,
            port,
            shipDetails: JSON.stringify(shipDetails),
            otherService: otherService ? otherService : null
        }
        const selectedVendors = await getSelectedVendorsForRequest(serviceId, country);
        console.log("selectedVendors", selectedVendors)
        const status = (selectedVendors.length > 0) ? 'pending' : 'notRequested';
        requestDetails.status = status;
        const { insertId } = await addNewRequest(requestDetails);

        if (serviceId == -1) {
            return res.status(200).json({ message: "requested sucessfully" });
        }

        const { serviceName } = await getServiceName(serviceId);
        for (let vendor of selectedVendors) {
            const vendorInfo = await getVendorInfo(vendor.vendor_id)
            if (vendorInfo.length > 0) {
                await sendEmailToVendor(vendorInfo[0].company_email, vendorInfo[0].company_name, insertId, serviceName);
                const daata = await addDataToRequestVendors(vendor.vendor_id, insertId)
            }
        }
        return res.status(200).json({ message: "requested sucessfully" });
    } catch (err) {
        console.log("err", err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/fetch-service-requests', verifyToken, async (req, res) => {
    try {
        const { reqIdArr } = req.query;
        let finalResult = []
        
        if (!reqIdArr) {
            return res.status(200).json(finalResult);
        }
        // Call the function and handle the promise
        const serviceRequests = await fetchServiceRequestsByIds(reqIdArr);
        console.log("serviceRequests", serviceRequests)
        if (serviceRequests.length > 0) {
            const combinedResult = await fetchCombinedDataWithShipCode(serviceRequests);
            // Combine data based on ship_manager field
            let finalResult = await Promise.all(serviceRequests.map(async (serviceRequest) => {
                const matchingRow = combinedResult.find(combinedRow => combinedRow.id === serviceRequest.ship_manager);

                if (matchingRow) {
                    // Use the separate function to fetch service data
                    const serviceData = await fetchServiceDataById(serviceRequest.service_id);
                    // Combine the fields
                    return {
                        ...serviceRequest,
                        code: matchingRow.code,
                        serviceName: serviceData.serviceName,
                        serviceType: serviceData.serviceType,
                    };
                }
                // If no match found, return the original serviceRequest
                return serviceRequest;
            }));
            // Send the response to the client
            return res.status(200).json(finalResult);
        } else {
            return res.status(200).json({finalResult});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/approve-vendor-quote', async (req, res) => {
    console.log("req.body", req.body)
    try {
        const { id, addedCost } = req.body
        addedCost.forEach(each => {
            each.cost = parseFloat(each.cost) + parseFloat(each.addedCost)
            delete each.addedCost
        })
        await updateAdminAprovalStatus(id, JSON.stringify(addedCost))
        return res.status(200).json({ message: 'Successfully updated approval status' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
})
router.get('/vendors-accepted', async (req, res) => {
    try {
        const { serviceRequestId } = req.query;
        console.log("serviceRequestId", serviceRequestId)
        let vendorsAccepted = await fetchVendorsAccepetedRequestes(serviceRequestId)
        vendorsAccepted = vendorsAccepted.map(each => {
            each.serviceCost = each.serviceCost ? JSON.parse(each.serviceCost) : null
            each.addedCost = each.addedCost ? JSON.parse(each.addedCost) : null
            return each
        })
        const addedCost =  await getAddedCostFromServiceRequest(serviceRequestId)
        return res.status(200).json({ message: { vendorsAccepted, addedCost },  });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.post('/add-extra-cost', async (req, res) => {
    try {
        const { addedCost, serviceRequestId } = req.body;
        console.log("req.body", req.body);
        const vendorsAccepted = await addExtraCostServiceRequest(addedCost, serviceRequestId)
        await addExtraCostServiceRequestToServiceRequest(serviceRequestId)
        return res.status(200).json({ message: vendorsAccepted });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/service-request-for-manager', verifyToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const serviceRequests = await fetchServiceRequestsByShipManager(userId)
        const serviceRequestsWithOther = await fetchServiceRequestsWithOtherSerivceByShipManager(userId)
        let combainedArray = serviceRequestsWithOther.concat(serviceRequests)
        console.log("serviceRequests", serviceRequests);
        return res.status(200).json({ message: combainedArray });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/admin/service-requests-extra-details', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.query
        let shipDetails = await fetchShipDetails(requestId)
        let requestedVendors = await requestesVendors(requestId)
        return res.status(200).json({ shipDetails: JSON.parse(shipDetails[0].ship_details), requestedVendors });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.post('/shipmanger/accept-offer', verifyToken, async (req, res) => {
    try {
        const { requested_vendors_id, service_request_id } = req.body
        await closeAllTheRequestVendors(service_request_id)
        let shipDetails = await updateRequestedVendorOfferAwareded(requested_vendors_id)
        let requestedVendors = await updateServiceRequest(service_request_id)
        return res.status(200).json({ message: "Offer accepeted" });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/vendor/service-requests-extra-details', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.query
        let shipDetails = await fetchShipDetails(requestId)
        let requestedVendors = await requestesVendorsForVendor(requestId)
        if (requestedVendors.length > 0) {
            requestedVendors = requestedVendors.map(each => {
                if (each.addedCostMethod === 'auto') {
                    each.serviceCost = JSON.parse(each.serviceCost);
                    each.serviceCost[0].cost = parseFloat(each.serviceCost[0].cost) + parseFloat(each.addedCost);    
                } else {
                    each.serviceCost = JSON.parse(each.addedCost);
                }
                each.showOffer = true;
                return each
            })
        }
        return res.status(200).json({ shipDetails: JSON.parse(shipDetails[0].ship_details), requestedVendors });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/admin/service-requests', verifyToken, async (req, res) => {
    try {
        let serviceRequests = await fetchServiceRequests();
        let serviceRequestsWithOther = await fetchServiceRequestsWithOtherSerivce();
        let combainedArray = serviceRequestsWithOther.concat(serviceRequests)
        return res.status(200).json({ message: combainedArray });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/admin/approve-vendor-requests', verifyToken, async (req, res) => {
    try {
        let serviceRequests = await fetchServiceRequests()
        let newArray = []
        for (let each of serviceRequests) {
            let eachData = await getShipOwnerDetialsByID(each.ship_manager);
            let eachServiceName = await getServiceByID(each.service_id);
            each = { ...each, ...eachData, ...eachServiceName }
            newArray.push(each);
        }
        return res.status(200).json({ message: newArray });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/vendor/get-service-requests', verifyToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const pendingServiceRequest = await fetchPendingRequest(userId)
        return res.status(200).json({ message: pendingServiceRequest });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
})

router.get('/vendor/download-brochure/:filename', verifyToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const params = {
            Bucket: BUCKET,
            Key: filename,
        };

        const fileStream = s3.getObject(params).createReadStream();
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        fileStream.pipe(res);
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
})

module.exports = router;

