export class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  tryRequest(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove expired requests
    const validRequests = userRequests.filter(
      time => now - time < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}