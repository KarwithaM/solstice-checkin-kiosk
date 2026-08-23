// Helper to talk to Upstash Redis via REST API
async function redisCommand(command, ...args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  // Upstash REST API encodes commands in the URL path
  const encodedCommand = encodeURIComponent(command);
  const encodedArgs = args.map(a => encodeURIComponent(String(a))).join('/');
  const fullUrl = `${url}/${encodedCommand}${encodedArgs ? '/' + encodedArgs : ''}`;
  
  // CRITICAL FIX: Upstash requires ALL requests to be POST, even for GET commands
  const response = await fetch(fullUrl, {
    method: 'POST', // <-- THIS WAS MISSING!
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Redis command failed: ${await response.text()}`);
  }
  
  return response.json();
}

module.exports = { redisCommand };
