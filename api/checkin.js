const { redisCommand } = require('../lib/redis');
const attendees = require('../attendees.json');

module.exports = async (req, res) => {
  // 1. Only allow POST requests (scanning a QR code sends data)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { qrCode } = req.body;

    // 2. Validate the QR code belongs to a real attendee
    if (!qrCode || !attendees[qrCode]) {
      return res.status(404).json({ error: "Unknown QR code" });
    }

    const attendee = attendees[qrCode];

           // 3. DUPLICATE PROTECTION: Check current status in Redis
    const currentStatus = await redisCommand('GET', `attendee:${qrCode}:status`);
    
    // TEMPORARY DEBUG LOGS
    console.log("DEBUG: QR Code =", qrCode);
    console.log("DEBUG: Current Status from Redis =", currentStatus);

    if (currentStatus === 'pending' || currentStatus === 'checked_in') {
      return res.status(409).json({ 
        error: "Duplicate scan", 
        message: `${attendee.name} is already processing or checked in. No second badge will be printed.` 
      });
    }

    // 4. Push print job to the message queue (LPUSH adds to the left of a list)
    const printJob = {
      qrCode,
      name: attendee.name,
      timestamp: new Date().toISOString(),
      jobId: `job_${Date.now()}_${qrCode}`
    };

    await redisCommand('LPUSH', 'print_queue', JSON.stringify(printJob));

    // 5. Set status to "pending" with timestamp
    await redisCommand('SET', `attendee:${qrCode}:status`, 'pending');
    await redisCommand('SET', `attendee:${qrCode}:timestamp`, new Date().toISOString());

    // 6. Return pending status immediately (async model)
    res.status(202).json({
      success: true,
      message: `Print job queued for ${attendee.name}`,
      status: 'pending',
      jobId: printJob.jobId,
      note: "Screen should show 'Pending...' until webhook confirmation arrives"
    });

  } catch (error) {
    console.error("Check-in failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
