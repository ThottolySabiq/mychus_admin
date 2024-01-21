const crypto = require('crypto');
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const db = require('../db');
const secretKey = '$@h4Dqlo-Qsz';

const transporter = nodemailer.createTransport({
    host: "mail.aqueongroup.com",
    port: 465,
    secure: true,
    auth: {
      user: 'registrations@aqueongroup.com',
      pass: 'Aqueon@123'
    }
});

// Middleware to verify JWT token.
function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).json({ message: 'Token is required.' });
    }
    const token = req.headers.authorization.split(' ')[1];;
    if (!token) {
      return res.status(403).json({ message: 'Token is required.' });
    }
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      req.user = user; // Attach the decoded user to the request object.
      next();
    });
}

const fetchServiceDataById = (serviceId) => {
    return new Promise((resolve, reject) => {
      db.query(`
        SELECT serviceName, serviceType
        FROM services
        WHERE id = ?
      `, [serviceId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0]); // Assuming there's only one result
        }
      });
    });
  };
  
const vendorSignup = (vendorDetails) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO aqueon.vendors (company_name, company_email, password, contact_number, personal_email, country, district, state, city, approval_status, salt, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [vendorDetails.companyName, vendorDetails.companyEmail, vendorDetails.hashedPassword, vendorDetails.contactNumber, null , vendorDetails.Country, 'NULL', 'NULL', 'NULL', 'approved', vendorDetails.salt, vendorDetails.vendorCode];
        db.query(sql, values, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        }); 
    })
}

const shipOwnerSignup = (vendorDetails) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO aqueon.ship_owners (company_name, company_email, password, contact_number, country, salt, active, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [vendorDetails.companyName, vendorDetails.companyEmail, vendorDetails.hashedPassword, vendorDetails.contactNumber, vendorDetails.Country, vendorDetails.salt, 'true' ,vendorDetails.shipOwnerCode];
        db.query(sql, values, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        }); 
    })
}

const fetchCombinedDataWithShipCode = (serviceRequests) => {
    return new Promise((resolve, reject) => {
      const shipManagerValues = serviceRequests.map(entry => entry.ship_manager);
      const placeholders = shipManagerValues.map(() => '?').join(',');
  
      const sql = `
        SELECT id, code
        FROM ship_owners
        WHERE id IN (${placeholders})
      `;
      const values = shipManagerValues;
  
      db.query(sql, values, (err, result) => {
        if (err) {
          // Reject with the error
          reject(err);
        } else {
          // Resolve with the result
          resolve(result);
        }
      });
    });
  };
  
const fetchServiceRequestsByIds = (reqIdArr) => {
    return new Promise((resolve, reject) => {
      const reqIdArrNumbers = reqIdArr.map(Number);
  
      // Use a placeholder for each element in the array
      const placeholders = reqIdArrNumbers.map(() => '?').join(',');
  
      // SQL query to fetch data
      const sql = `
        SELECT *
        FROM service_request
        WHERE id IN (${placeholders})
      `;
  
      db.query(sql, reqIdArrNumbers, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  };
  
  
const generateVendorCode = (name) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id FROM aqueon.vendors ORDER BY id DESC LIMIT 1;`;
        db.query(sql,(err, result) => {
            if (err) {
                console.log("err", err)
                reject(err);
            }
            console.log("result", result);
            if (result && result.length > 0) {}
            const initials = name.substring(0, 3);
            const idNum = result[0] ? (result[0].id + 1) : 0;
            const paddedNumber = idNum.toString().padStart(4, '0');
            const id = initials + paddedNumber;
            resolve(id)
        }); 
    })
}

const generateShipOwnerCode = (name) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id FROM aqueon.ship_owners ORDER BY id DESC LIMIT 1;`;
        db.query(sql,(err, result) => {
            if (err) {
                console.log("err", err)
                reject(err);
            }
            console.log("result", result);
            if (result && result.length > 0) {}
            const initials = name.substring(0, 3);
            const idNum = result[0] ? (result[0].id + 1) : 0;
            const paddedNumber = idNum.toString().padStart(4, '0');
            const id = 'O-' + initials + paddedNumber;
            resolve(id)
        }); 
    })
}


function hashPassword(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(derivedKey.toString('hex'));
        }
      });
    });
}

const generatePassword = () => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@";
    let password = "";
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset.charAt(randomIndex);
    }
  
    return password;
}

const sendEmailToSupplier = async (companyEmail, password) => {
    const info = await transporter.sendMail({
        from: '"aqueon group support" <registrations@aqueongroup.com>', // sender address
        to: companyEmail, // list of receivers
        subject: "Successfully registiered", // Subject line
        html: getHtmlContetnforEmailVendor(companyEmail, password)
    });
}

const sendOfferMailToShipOwner = async (companyEmail, companyName) => {
    const info = await transporter.sendMail({
        from: '"aqueon group support" <registrations@aqueongroup.com>', // sender address
        to: companyEmail, // list of receivers
        subject: "New Offer", // Subject line
        html: getHtmlContetnforOfferEmailToShipOwner(companyName)
    });
}

const sendEmailToAdmin = async (companyName, companyEmail, contactNumber, Country, userType) => {
    const info = await transporter.sendMail({
        from: '"aqueon group support" <registrations@aqueongroup.com>', // sender address
        to: "registrations@aqueongroup.com", // list of receivers
        subject: "New Supplier Registiered", // Subject line
        html: getHtmlContentforEmailAdmin(companyName, companyEmail, contactNumber, Country, userType)
    });
}

const getSaltAndPassWordFromVendor = (email, userType) => {
    let table = 'vendors';
    if (userType === 'shipManager') {
        table = 'ship_owners'
    }
    const sql = `SELECT id, company_name ,company_email, salt, password, code FROM aqueon.${table} WHERE company_email = ?`;
    return new Promise((resolve, reject) => {
        db.query(sql, email, (err, results) => {
            console.log("results", results)
            resolve(results && results.length ? results[0] : { });
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        }); 
    })
}

const updatePassword = (password, vendorId, salt) => {
    const sql = 'UPDATE aqueon.vendors SET password = ?, salt = ?  WHERE id = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [password, salt, vendorId], (err, results) => {
            resolve(results);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        }); 
    })
}

const getHtmlContetnforOfferEmailToShipOwner = (companyName) => `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Offer Notification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-collapse: collapse;
                }
                .header {
                    padding: 20px 0;
                    text-align: center;
                    background-color: #0073e6;
                    color: #fff;
                }
                .content {
                    padding: 20px;
                }
                .content p {
                    margin: 0 0 20px;
                }
            </style>
        </head>
        <body>
            <table class="container">
                <tr>
                    <td class="header">
                        <h1>You Have New Offer</h1>
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        <p>Dear ${companyName},</p>
                        <p>You have a new offer from a supplier. Please check in the portal for more details</p>
                        <p>Best regards,</p>
                    </td>
                </tr>
            </table>
        </body>
    </html>`

const getHtmlContentforEmailAdmin = (companyName, companyEmail, contactNumber, Country, userType) => `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New ${(userType === 'shipManager') ? 'Ship manager': 'Supplier'} Registration Notification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-collapse: collapse;
                }
                .header {
                    padding: 20px 0;
                    text-align: center;
                    background-color: #0073e6;
                    color: #fff;
                }
                .content {
                    padding: 20px;
                }
                .content p {
                    margin: 0 0 20px;
                }
            </style>
        </head>
        <body>
            <table class="container">
                <tr>
                    <td class="header">
                        <h1>New ${(userType === 'shipManager') ? 'Ship manager': 'Supplier'} Registration Notification</h1>
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        <p>Dear Admin,</p>
                        <p>We have a new ${(userType === 'shipManager') ? 'ship manager': 'supplier'} registration on our platform. Here are the ${(userType === 'shipManager') ? "ship manager's": "supplier's"} details:</p>
                        <ul>
                            <li><strong>Company Name:</strong> ${companyName}</li>
                            <li><strong>Company Email:</strong> ${companyEmail}</li>
                            <li><strong>Contact Number:</strong> ${contactNumber}</li>
                            <li><strong>Country:</strong> ${Country}</li>
                        </ul>
                        <p>Please review the information.</p>
                        <p>Best regards,</p>
                    </td>
                </tr>
            </table>
        </body>
    </html>`

const getHtmlContetnforEmailVendor = (companyEmail, password) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Aqueon</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
        <tr>
            <td style="padding: 20px 0; text-align: center; background-color: #0073e6; color: #fff;">
                <h1>Welcome to Aqueon</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px;">
                <p>Hello,</p>
                <p>We are excited to welcome you to aqueon! Your registration has been successfully completed, and you are now a valued member of our community.</p>
                <p>Here are your registration details:</p>
                <ul>
                    <li><strong>Username/Email:</strong> ${companyEmail}</li>
                    <li><strong>Auto-Generated Password:</strong> ${password}</li>
                </ul>
                <p>For security reasons, we have generated a temporary password for your account. To enhance the security of your account, we recommend that you change your password as soon as possible. To change your password, please follow these steps:</p>
                <ol>
                    <li>Log in to your account using your provided username/email and the auto-generated password.</li>
                    <li>Once logged in, navigate to your account settings.</li>
                    <li>Look for the "Change Password" option.</li>
                </ol>
                <p>Your account is important to us, and we are committed to providing you with a safe and seamless experience on our platform. If you encounter any issues during the password change process or have any questions about using the platform, please do not hesitate to reach out to our support team. We are here to assist you.</p>
                <p>Thank you for choosing aqueon. We look forward to serving you and hope you have a fantastic experience with us.</p>
                <p>Login into: <a href="https://aqueongroup.com/app/login">https://aqueongroup.com/app/login</a></p>
                <p>Best regards,</p>
                <p><br>Aqueon Group<br>info@aqueongroup.com<br><a href="https://aqueongroup.com/">aqueongroup.com</a></p>
            </td>
        </tr>
    </table>
</body>
    </html>`

    
module.exports = { hashPassword, generatePassword, sendEmailToSupplier, sendEmailToAdmin, sendEmailToAdmin, getSaltAndPassWordFromVendor, fetchServiceDataById,
         updatePassword, vendorSignup, verifyToken, generateVendorCode, generateShipOwnerCode, shipOwnerSignup, fetchServiceRequestsByIds, fetchCombinedDataWithShipCode, sendOfferMailToShipOwner};
    
    
    