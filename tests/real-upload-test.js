import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
import { SharedArray } from "k6/data";

// Custom metrics
const uploadSuccessRate = new Rate("upload_success");
const rateLimitRate = new Rate("rate_limit_hits");

export const options = {
  stages: [
    { duration: "15s", target: 2 }, // Ramp up to 2 users
    { duration: "45s", target: 2 }, // Stay at 2 users for 45 seconds
    { duration: "15s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<15000"], // 95% of requests should be below 15s
    http_req_failed: ["rate<0.3"], // Error rate should be less than 30%
    upload_success: ["rate>0.5"], // At least 50% upload success rate
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Create different file sizes for testing
const fileSizes = [
  1024 * 1024, // 1MB
  2 * 1024 * 1024, // 2MB
  5 * 1024 * 1024, // 5MB
  10 * 1024 * 1024, // 10MB
];

export default function () {
  const userId = Math.random().toString(36).substr(2, 6);
  const timestamp = Date.now();

  // Random file size
  const fileSize = fileSizes[Math.floor(Math.random() * fileSizes.length)];
  const fileName = `test_${fileSize / (1024 * 1024)}mb_${timestamp}.jpg`;

  // Create a simple file payload (simplified for k6)
  const fileContent = "A".repeat(fileSize);

  // Test upload with multipart form data
  const boundary =
    "----WebKitFormBoundary" + Math.random().toString(36).substr(2, 9);
  const payload =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n` +
    fileContent +
    `\r\n` +
    `--${boundary}--\r\n`;

  const uploadResponse = http.post(`${BASE_URL}/api/upload`, payload, {
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    timeout: "30s",
  });

  // Check upload response
  const uploadCheck = check(uploadResponse, {
    "upload status is 200": (r) => r.status === 200,
    "upload status is 429 (rate limit)": (r) => r.status === 429,
    "upload response time < 30s": (r) => r.timings.duration < 30000,
  });

  if (uploadResponse.status === 200) {
    uploadSuccessRate.add(1);
    console.log(
      `✅ Upload successful: ${fileName} (${fileSize / (1024 * 1024)}MB)`
    );
  } else if (uploadResponse.status === 429) {
    rateLimitRate.add(1);
    console.log(`⏰ Rate limit hit: ${fileName}`);
  } else {
    console.log(
      `❌ Upload failed: ${uploadResponse.status} - ${uploadResponse.body}`
    );
  }

  // Test storage usage after upload
  const storageResponse = http.get(`${BASE_URL}/api/storage-usage`);

  check(storageResponse, {
    "storage API status is 200": (r) => r.status === 200,
    "storage API response time < 2s": (r) => r.timings.duration < 2000,
  });

  // Test gallery page loads
  const galleryResponse = http.get(`${BASE_URL}/gallery`);

  check(galleryResponse, {
    "gallery page status is 200": (r) => r.status === 200,
    "gallery page response time < 3s": (r) => r.timings.duration < 3000,
  });

  // Random delay between 3-10 seconds (realistic upload intervals)
  sleep(Math.random() * 7 + 3);
}
