const mysql = require('mysql');
var db;

function handleDisconnect() {
    db = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'mychus_db'
    })

    db.connect(function (err) {
        if (err) {
            console.log('!! ERROR !!', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
            throw err
        }
        console.log('SUCCESSFULLY CONNECTED TO DATABASE');
    })

    db.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

module.exports = db;
