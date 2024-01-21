const crypto = require('crypto');
const SECRET_PASSWORD = 'Sabiqt@1996'
const nodemailer = require("nodemailer");
const db = require('../db');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'sabiqt@gmail.com',
        pass: 'dqze majk srad rvrv'
    }
});

// Function to hash a password using a salt.
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
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]|:;<>,.?~";
    let password = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset.charAt(randomIndex);
    }

    return password;
}

const sendEmailToSupplier = async (companyEmail, password) => {
    const info = await transporter.sendMail({
        from: '"aqueon group support" <sabiqt@gmail.com>', // sender address
        to: "thottolysabiq@gmail.com", // list of receivers
        subject: "Successfully registiered", // Subject line
        html: `<!DOCTYPE html>
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
                        <p>Best regards,</p>
                        <p><br>aqueon<br>info@aqueongroup.com<br><a href="https://aqueongroup.com/">aqueongroup.com</a></p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `,
    });
}

const sendEmailToAdmin = async (companyName, companyEmail, contactNumber, Country) => {
    const info = await transporter.sendMail({
        from: '"aqueon group support" <sabiqt@gmail.com>', // sender address
        to: "thottolysabiq@gmail.com", // list of receivers
        subject: "New Supplier Registiered", // Subject line
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Supplier Registration Notification</title>
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
                        <h1>New Supplier Registration Notification</h1>
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        <p>Dear Admin,</p>
                        <p>We have a new supplier registration on our platform. Here are the supplier's details:</p>
                        <ul>
                            <li><strong>Company Name:</strong> ${companyName}</li>
                            <li><strong>Company Email:</strong> ${companyEmail}</li>
                            <li><strong>Contact Number:</strong> ${contactNumber}</li>
                            <li><strong>Country:</strong> ${Country}</li>
                        </ul>
                        <p>Please review the information and feel free to contact the supplier if needed.</p>
                        <p>Login into: <a href="https://aqueongroup.com/app/login">https://aqueongroup.com/app/login</a></p>
                        <p>Best regards,</p>
                        <p>[Your Name]<br>[Your Company/Platform Name]</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `, // html body
    });
}

const sendInviteEmailToVendors = async (vendorEmails) => {

    for (const email of vendorEmails) {
        try {
            const info = await transporter.sendMail({

                from: '"aqueon group support" <sabiqt@gmail.com>',

                to: email,

                subject: "Registor As Supplier",

                html: `<!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>New Supplier Registration Notification</title>

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

                        <h1>New Supplier Registration Notification</h1>

                    </td>

                </tr>

                <tr>

                    <td class="content">

                        <p>Dear Supplier,</p>

                        <p>We hope this email finds you well.

                         Aqueon Group welcomes you as a potential supplier for our website,

                          offering your valuable services for ships. We appreciate your interest 

                          in joining our network and contributing to the success of Aqueon Group.

                          </p>

                          <p>

                          To complete your supplier registration, please follow the steps below:

                          </p>

                          <p>

                          To complete your supplier registration, please follow the steps below:

                          </p>

                        <p><a href="https://aqueongroup.com/app/signup">https://aqueongroup.com/app/signup</a></p>

                        <p>Best regards,</p>

                        <p>Aqueon Groups</p>

                    </td>

                </tr>

            </table>

        </body>

        </html>

        `, // html body

            });
        } catch (error) {
            console.error(`Error sending email to ${email}:`, error);
        }
    }
}

const getSaltAndPassWordFromVendor = (email) => {
    console.log("email", email)
    const sql = 'SELECT company_email, salt, password FROM aqueon.vendors WHERE company_email = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, email, (err, results) => {
            resolve(results[0]);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        });
    })
}


const updateVendorCertificates = (filename, vendorId, fieldname) => {
    const sql = 'INSERT INTO aqueon.vendors_certificates (filename, vendor, type) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
        db.query(sql, [filename, vendorId, fieldname], (err, results) => {
            resolve(results[0]);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        });
    })
}

const updatePassword = (password, vendorId, salt) => {
    const sql = 'UPDATE aqueon.vendors SET password = ?, salt = ?,  WHERE id = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [password, salt, vendorId], (err, results) => {
            resolve(results[0]);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        });
    })
}

const getVendorsDetials = (email) => {
    const sql = 'SELECT * FROM aqueon.vendors WHERE company_email = ?';
    return new Promise((resolve, reject) => {
        db.query(sql, [email], (err, results) => {
            resolve(results[0]);
            if (err) {
                console.error('Error fetching data:', err);
                reject(err)
            }
        });
    })
}

module.exports = {
    hashPassword, generatePassword, sendEmailToSupplier, sendInviteEmailToVendors, sendEmailToAdmin, sendEmailToAdmin, getSaltAndPassWordFromVendor,
    updateVendorCertificates, updatePassword, getVendorsDetials
};


