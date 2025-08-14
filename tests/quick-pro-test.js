import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 5 }, // Ramp up to 5 users
    { duration: "30s", target: 5 }, // Stay at 5 users for 30 seconds
    { duration: "10s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"], // 95% of requests should be below 3s
    http_req_failed: ["rate<0.1"], // Error rate should be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Test 1: Check storage usage (API endpoint)
  const storageResponse = http.get(`${BASE_URL}/api/storage-usage`);

  check(storageResponse, {
    "storage API status is 200": (r) => r.status === 200,
    "storage API response time < 2s": (r) => r.timings.duration < 2000,
  });

  // Test 2: Check main page loads
  const mainPageResponse = http.get(`${BASE_URL}/`);

  check(mainPageResponse, {
    "main page status is 200": (r) => r.status === 200,
    "main page response time < 3s": (r) => r.timings.duration < 3000,
  });

  // Test 3: Check gallery page
  const galleryResponse = http.get(`${BASE_URL}/gallery`);

  check(galleryResponse, {
    "gallery page status is 200": (r) => r.status === 200,
    "gallery page response time < 3s": (r) => r.timings.duration < 3000,
  });

  // Test 4: Check monitor page
  const monitorResponse = http.get(`${BASE_URL}/monitor`);

  check(monitorResponse, {
    "monitor page status is 200": (r) => r.status === 200,
    "monitor page response time < 3s": (r) => r.timings.duration < 3000,
  });

  // Random delay between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}
