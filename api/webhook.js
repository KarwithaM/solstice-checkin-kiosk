const { redisCommand } = require('../lib/redis');
const attendees = require('../attendees.json');

module.exports = async (req, res) => {
  // 1. Only allow POST requests (webhooks push data)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { qrCode, jobId, status, completedAt } = req.body;

    // 2. Validate payload
    if (!qrCode || !status) {
      return res.status(400).json({ error: "Invalid webhook payload. Must include 'qrCode' and 'status'." });
    }

    // 3. OUT-OF-ORDER PROTECTION: Only update if this confirmation is newer
    // than what we already have stored
    const existingTimestamp = await redisCommand('GET', `attendee:${qrCode}:timestamp`);
    const newTimestamp = completedAt || new Date().toISOString();

    if (existingTimestamp && new Date(existingTimestamp) > new Date(newTimestamp)) {
      // This is an old/out-of-order confirmation - ignore it
      console.log(`Ignoring out-of-order webhook for ${qrCode}`);
      return res.status(200).json({ 
        success: true, 
        message: "Out-of-order confirmation ignored",
        note: "More recent status already recorded"
      });
    }

    // 4. Update status in Redis
    await redisCommand('SET', `attendee:${qrCode}:status`, status);
    await redisCommand('SET', `attendee:${qrCode}:timestamp`, newTimestamp);
    if (jobId) {
      await redisCommand('SET', `attendee:${qrCode}:jobId`, jobId);
    }

    console.log(`Webhook: ${qrCode} status updated to ${status}`);

    res.status(200).json({
      success: true,
      message: `Status updated for ${qrCode}`,
      newStatus: status
    });

  } catch (error) {
    console.error("Webhook processing failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
