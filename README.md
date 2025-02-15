# Rate Limiter

## Overview
This project is an implementation of a **Rate Limiter** in Node.js using **Express.js** and **Redis**. It provides three different rate limiting strategies:

1. **Fixed Window** – Limits requests within fixed time intervals.
2. **Sliding Window** – Tracks request timestamps within a rolling time window.
3. **Token Bucket** – Implements a token-based rate limiter with continuous replenishment.

## Technologies Used
- **Node.js**
- **Express.js**
- **Redis**
- **JavaScript (ES6+)**

## Installation

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v14+ recommended)
- **Redis**

### Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/HatemRamadan/rate-limiter.git
   cd rate-limiter
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start Redis server (if not already running):
   ```sh
   redis-server
   ```
4. Run the application:
   ```sh
   node index.js
   ```

## Usage
This server provides three different rate-limiting strategies that can be accessed via the following endpoints:

### 1. Fixed Window Rate Limiting
```sh
GET http://localhost:3000/fixed-window
```

### 2. Sliding Window Rate Limiting
```sh
GET http://localhost:3000/sliding-window
```

### 3. Token Bucket Rate Limiting
```sh
GET http://localhost:3000/token-bucket
```

## How It Works
Each request goes through the middleware that determines which rate-limiting technique to apply based on the requested URL path. The user is identified by their IP address, and Redis is used to store and track request counts for rate limiting.

### Rate Limiting Strategies:

#### 1. Fixed Window
- Requests are counted within fixed time intervals (e.g., every 60 seconds).
- Once the limit is reached, all additional requests within the same window are blocked.

#### 2. Sliding Window
- Keeps track of request timestamps within a rolling time frame.
- Provides a more flexible limit by allowing requests as long as they fit within the threshold.

#### 3. Token Bucket
- Tokens are added at a constant rate.
- A request consumes a token, and if no tokens are available, the request is denied.
- This approach prevents bursts while allowing consistent traffic.

## Configuration
The rate limiter behavior can be configured using the following variables:

```js
const WINDOW_SIZE = 60000; // 1 minute in milliseconds
const RATE_LIMIT = 3; // Maximum requests per window
const REFILL_RATE_PER_SECOND = 0.2;
const MAXIMUM_BUCKET_SIZE = 3;
```

## Error Handling
If a user exceeds the allowed request limit, they receive a **429 Too Many Requests** response.

## Future Improvements
- Add support for user-specific rate limits (e.g., API keys instead of IP-based limits).
- Implement Redis expiry to clean up old data and optimize performance.
- Use environment variables for configuration.

## License
This project is open-source and available under the MIT License.

## Author
Hatem Ramadan - https://github.com/HatemRamadan

