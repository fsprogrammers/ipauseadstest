const express = require('express');
const app = express();

app.get('/test-headers', (req, res) => {
  res.json({
    allHeaders: req.headers,
    ip: req.ip,
    ips: req.ips,
    connection: {
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort
    },
    socket: {
      remoteAddress: req.socket.remoteAddress,
      remotePort: req.socket.remotePort
    }
  });
});

app.listen(4001, () => {
  console.log('Test server running on port 4001');
});
