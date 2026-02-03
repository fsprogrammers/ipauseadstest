const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const Scan = require('./src/models/Scan');
  
  //Get the most recent scan
  const latestScan = await Scan.findOne().sort({ timestamp: -1 }).lean();
  
  if (latestScan) {
    console.log('=== LATEST SCAN ===');
    console.log('QR ID:', latestScan.qrId);
    console.log('Timestamp:', latestScan.timestamp);
    console.log('IP:', latestScan.ip);
    console.log('Device Info:', JSON.stringify(latestScan.deviceInfo, null, 2));
    console.log('');
    console.log('=== GEO DATA ===');
    console.log('City:', latestScan.deviceInfo?.geo?.city);
    console.log('Region:', latestScan.deviceInfo?.geo?.region);
    console.log('Country:', latestScan.deviceInfo?.geo?.country);
    console.log('Timezone:', latestScan.deviceInfo?.geo?.timezone);
  } else {
    console.log('No scans found');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
