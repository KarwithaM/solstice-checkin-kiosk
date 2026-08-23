// Helper to talk to Upstash Redis via REST API
async function redisCommand(command, ...args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  const lowerCommand = command.toLowerCase();
  const encodedArgs = args.map(a => encodeURIComponent(String(a))).join('/');
  const fullUrl = encodedArgs 
    ? `${url}/${lowerCommand}/${encodedArgs}` 
    : `${url}/${lowerCommand}`;
  
  const response = await fetch(fullUrl, {
    method: 'POST', // Upstash requires POST for ALL commands
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Redis command failed: ${data.error}`);
  }
  
  // Upstash returns { result: value }. We want just the value.
  // This fallback ensures we always get the primitive string/value.
  return data.result !== undefined ? data.result : data;
}

module.exports = { redisCommand };
