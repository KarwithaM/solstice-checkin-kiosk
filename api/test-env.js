module.exports = (req, res) => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  res.status(200).json({
    hasUrl: !!url,
    hasToken: !!token,
    urlPreview: url ? url.substring(0, 30) + '...' : 'NOT SET',
    tokenPreview: token ? token.substring(0, 10) + '...' : 'NOT SET'
  });
};
