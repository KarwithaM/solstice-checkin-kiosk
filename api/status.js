const { redisCommand } = require('../lib/redis');
const attendees = require('../attendees.json');

module.exports = async (req, res) => {
  const { qrCode } = req.query;

  // 1. Validate the QR code
  if (!qrCode || !attendees[qrCode]) {
    return res.status(404).json({ error: "Unknown QR code" });
  }

  try {
    const attendee = attendees[qrCode];
    
    // 2. Get current status from Redis
    const status = await redisCommand('GET', `attendee:${qrCode}:status`);
    const timestamp = await redisCommand('GET', `attendee:${qrCode}:timestamp`);
    const jobId = await redisCommand('GET', `attendee:${qrCode}:jobId`);

    // 3. Return the current state
    res.status(200).json({
      qrCode,
      name: attendee.name,
      status: status || 'not_checked_in',
      lastUpdated: timestamp,
      jobId: jobId
    });

  } catch (error) {
    console.error("Status check failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
