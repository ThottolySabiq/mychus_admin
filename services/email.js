const getHtmlForVendorServiceRequest = (companyName, requestId, serviceName, dateString) => `<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>New Service Request Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        #container {
            width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
        }

        h2 {
            color: #0072c6;
        }

        ul {
            list-style: none;
            padding: 0;
        }

        ul li {
            margin-bottom: 10px;
        }

        a {
            color: #0072c6;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        .signature {
            font-size: 14px;
            color: #555;
        }
    </style>
</head>

<body>
    <div id="container">
        <p style="font-size: 18px; color: #0072c6;">Dear ${companyName},</p>
        <h2>New Service Request Notification</h2>
        <p>We have a new service request that requires your prompt attention:</p>
        <ul>
            <li><strong>Request ID:</strong> ${requestId}</li>
            <li><strong>Service Type:</strong> ${serviceName}</li>
            <li><strong>Request Date:</strong> ${dateString}</li>
        </ul>
        <p>Please review this request, confirm your availability, and provide an initial assessment.</p>
        <p>If you have questions, contact us at <a href="mailto:info@aqueongroup.com">info@aqueongroup.com</a>.</p>
        <p style="font-size: 16px;">Thank you for your quick response.</p>
        <p class="signature">Best regards,<br>Aqueon Group</p>
    </div>
</body>

</html>

`

module.exports = { getHtmlForVendorServiceRequest };