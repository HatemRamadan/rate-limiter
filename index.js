const express = require('express');
const redis = require('redis');
const app = express();
const port = 3000;

// Window size in milliseconds
const WINDOW_SIZE = 60000;

// Number of allowed requests per window interval
const RATE_LIMIT = 3;

const REFILL_RATE_PER_SECOND = 0.2;
const MAXIMUM_BUCKET_SIZE = 3;

// Filter timestamps within the current window period
function filterRequestsWithinWindow(timestamps, currentRequestTimestamp) {
  const filteredTimestamps = timestamps.filter(timestamp => timestamp > currentRequestTimestamp - WINDOW_SIZE);
  return filteredTimestamps;
}

/**
 * Checks if a request should be allowed based on the rate limiting strategy
 * @param {string} rateLimitTechnique - The rate limiting strategy to use ('fixed-window', 'sliding-window', or 'token-bucket')
 * @param {string} userIdentifier - Unique identifier for the user (e.g., IP address)
 * @returns {Promise<boolean>} - Returns true if request is allowed, false if rate limit exceeded
 * 
 * Implements three rate limiting strategies:
 * 1. Fixed Window - Counts requests in fixed time windows (e.g., per minute)
 * 2. Sliding Window - Tracks timestamps of requests within a rolling time window
 * 3. Token Bucket - Implements token bucket algorithm with continuous rate limiting
 */
async function checkRateLimit(rateLimitTechnique, userIdentifier) {
  const client = await redis.createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

  switch(rateLimitTechnique){
    case 'fixed-window': {
      // Calculate the current window start
      const window = Math.floor(Date.now()/WINDOW_SIZE);
      const counter = await client.get(`${userIdentifier}:${window}`);
      if (counter > RATE_LIMIT) {
        return false
      }
    
      await client.incr(`${userIdentifier}:${window}`);
      return true;
    }

    case 'sliding-window': {
      const previousRequests = await client.get(`${userIdentifier}`);

      if (previousRequests) {
        const currentRequestTimestamp = Date.now();
        const requestsWithinWindow = filterRequestsWithinWindow(JSON.parse(previousRequests), currentRequestTimestamp);
        if (requestsWithinWindow.length > RATE_LIMIT) {
          return false;
        }
      
        // Add the current request
        requestsWithinWindow.push(currentRequestTimestamp);
        await client.set(`${userIdentifier}`, JSON.stringify(requestsWithinWindow));
        return true;
      }
    }

    case 'token-bucket': {
      const lastRefill = await client.get(`${userIdentifier}:lastRefill`);
      const count = await client.get(`${userIdentifier}:count`);
      
      // Initialize the last bucket refill to now and count to maximum bucket size
      const currentTime = Math.round(Date.now()/1000);
      if (!lastRefill) {
        await client.set(`${userIdentifier}:count`, MAXIMUM_BUCKET_SIZE - 1);
        await client.set(`${userIdentifier}:lastRefill`, currentTime);
        return true;
      }
    
      // Calculate the number of the tokens in the bucket according to the refill rate
      const secondsSinceLastRefill = currentTime - lastRefill;
      const newCount = Math.min(Number(count) + Math.round(secondsSinceLastRefill * REFILL_RATE_PER_SECOND), MAXIMUM_BUCKET_SIZE);
    
      // Remove a token for the current request
      await client.set(`${userIdentifier}:count`, Math.max(newCount - 1, 0));
      await client.set(`${userIdentifier}:lastRefill`, currentTime);
      if (newCount === 0) {
        return false
      }
      return true;
    }

    default: return false;
  }
}

app.use(async (req, res, next) => {
  const rateLimitTechnique = req.originalUrl.slice(1);

  // Identifier for the user can be IP or geoLocation or email
  const userIdentifier = req.ip;

  const requestWithinLimit = await checkRateLimit(rateLimitTechnique, userIdentifier);

  if (!requestWithinLimit) {
    return res.status(429).send('Too many requests');
  }

  next();
})

app.get('/fixed-window', async (req, res) => {
  res.send(`Hello World!`);
});

app.get('/sliding-window', async (req, res) => {
  res.send(`Hello World!`);
});

app.get('/token-bucket', async (req, res) => {
  res.send(`Hello World!`);
});



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});