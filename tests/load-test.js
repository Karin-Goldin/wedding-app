import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const uploadSuccessRate = new Rate("upload_success_rate");
const uploadDuration = new Trend("upload_duration");
const storageUsageDuration = new Trend("storage_usage_duration");

// Test configuration
export const options = {
  stages: [
    // Ramp up to 20 users over 30 seconds
    { duration: "30s", target: 20 },
    // Stay at 20 users for 2 minutes
    { duration: "2m", target: 20 },
    // Ramp down to 0 users over 30 seconds
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // 95% of uploads should succeed
    upload_success_rate: ["rate>0.95"],
    // 95% of uploads should complete within 10 seconds
    upload_duration: ["p(95)<10000"],
    // 95% of storage usage checks should complete within 2 seconds
    storage_usage_duration: ["p(95)<2000"],
  },
};

// Test data - small test images
const testImages = [
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
];

export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

  // Simulate user behavior
  const userThinkTime = Math.random() * 3 + 1; // 1-4 seconds

  // Test 1: Check storage usage (simulates monitoring dashboard)
  const storageStart = Date.now();
  const storageResponse = http.get(`${baseUrl}/api/storage-usage`);
  const storageDuration = Date.now() - storageStart;

  check(storageResponse, {
    "storage usage accessible": (r) => r.status === 200,
    "storage response time < 2s": (r) => r.timings.duration < 2000,
  });

  storageUsageDuration.add(storageDuration);

  // Test 2: Simulate file upload
  const imageData = testImages[Math.floor(Math.random() * testImages.length)];
  const fileName = `test-photo-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}.jpg`;

  // Create a simple form data payload
  const payload = {
    file: imageData,
    filename: fileName,
  };

  const uploadStart = Date.now();
  const uploadResponse = http.post(
    `${baseUrl}/api/upload`,
    JSON.stringify(payload),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const uploadDuration = Date.now() - uploadStart;

  // Check upload response
  const uploadSuccess = check(uploadResponse, {
    "upload successful": (r) => r.status === 200 || r.status === 201,
    "upload response time < 10s": (r) => r.timings.duration < 10000,
    "upload has response body": (r) => r.body.length > 0,
  });

  uploadSuccessRate.add(uploadSuccess);
  uploadDuration.add(uploadDuration);

  // Test 3: Check gallery (simulates users viewing photos)
  const galleryResponse = http.get(`${baseUrl}/api/gallery`);

  check(galleryResponse, {
    "gallery accessible": (r) => r.status === 200,
    "gallery response time < 3s": (r) => r.timings.duration < 3000,
  });

  // Simulate realistic user behavior
  sleep(userThinkTime);
}

// Setup function (runs once before the test)
export function setup() {
  console.log("🚀 Starting wedding app load test...");
  console.log(`📊 Target: 20 concurrent users`);
  console.log(`⏱️  Duration: 3 minutes total`);
  console.log(`🎯 Testing: Upload, Storage, Gallery APIs`);
}

// Teardown function (runs once after the test)
export function teardown(data) {
  console.log("✅ Load test completed!");
  console.log("📈 Check the metrics above for performance insights");
}

