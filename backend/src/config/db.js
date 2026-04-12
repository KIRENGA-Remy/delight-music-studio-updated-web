require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');

const connectionOptions = {
  host:               process.env.DB_HOST,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  port:               parseInt(process.env.DB_PORT) || 4000,
  waitForConnections: true,
  connectionLimit:    10,
  enableKeepAlive:  true,
};

if(process.env.DB_SSL === 'true') {
  connectionOptions.ssl ={ 
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }

  if (process.env.DB_CA_PATH) {
    connectionOptions.ssl.ca = fs.readFileSync(process.env.DB_CA_PATH);
  }
}

const pool = mysql.createPool(connectionOptions);

pool.getConnection((err, conn) => {
  if (err) { 
        console.error('❌ TiDB Cloud connection failed:', err.message);
        console.error('Please check your credentials and SSL settings');
        return; 
  }
  console.log('✅ TiDB Cloud connected successfully!');
  conn.release();
});

module.exports = pool.promise();
