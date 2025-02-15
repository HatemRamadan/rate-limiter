const express = require('express');
const redis = require('redis');
const app = express();
const port = 3000;

// Window size in milliseconds
const WINDOW_SIZE = 60000;

// Number of allowed requests per window interval
const RATE_LIMIT = 3;

app.get('/fixed-window', async (req, res) => {
  const client = await redis.createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

  // Identifier for the user can be IP or geoLocation or email
  const userIdentifier = req.ip;
  const window = Math.floor(Date.now()/WINDOW_SIZE);
  const counter = await client.get(`${userIdentifier}:${window}`);
  if (counter > RATE_LIMIT) {
    return res.status(429).send('Too many requests');
  }

  await client.incr(`${userIdentifier}:${window}`);
  res.send(`Hello World!`);
});


// Filter timestamps within the current window period
function filterRequestsWithinWindow(timestamps, currentRequestTimestamp) {
  const filteredTimestamps = timestamps.filter(timestamp => timestamp > currentRequestTimestamp - WINDOW_SIZE);
  return filteredTimestamps;
}

app.get('/sliding-window', async (req, res) => {
  const client = await redis.createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

  // Identifier for the user; can be IP or GeoLocation or email
  const userIdentifier = req.ip;
  const previousRequests = await client.get(`${userIdentifier}`);

  if (previousRequests) {
    const currentRequestTimestamp = Date.now();
    const requestsWithinWindow = filterRequestsWithinWindow(JSON.parse(previousRequests), currentRequestTimestamp);
    if (requestsWithinWindow.length > RATE_LIMIT) {
      return res.status(429).send('Too many requests'); 
    }
  
    // Add the current request
    requestsWithinWindow.push(currentRequestTimestamp);
    await client.set(`${userIdentifier}`, JSON.stringify(requestsWithinWindow));
  }

  res.send(`Hello World!`);
});



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});