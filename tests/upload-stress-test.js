import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const uploadSuccessRate = new Rate("upload_success_rate");
const uploadDuration = new Trend("upload_duration");
const errorRate = new Rate("error_rate");

// Test configuration - Focus on upload stress testing
export const options = {
  stages: [
    // Warm up with 5 users
    { duration: "30s", target: 5 },
    // Ramp up to 20 users
    { duration: "1m", target: 20 },
    // Peak load at 20 users for 3 minutes
    { duration: "3m", target: 20 },
    // Ramp down
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // 90% of uploads should succeed under stress
    upload_success_rate: ["rate>0.90"],
    // 95% of uploads should complete within 15 seconds
    upload_duration: ["p(95)<15000"],
    // Error rate should be less than 10%
    error_rate: ["rate<0.10"],
  },
};

// Minimal test image (1x1 pixel JPEG)
const testImage =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

  // Generate unique filename for each request
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const fileName = `stress-test-${timestamp}-${randomId}.jpg`;

  // Simulate file upload with minimal payload
  const payload = {
    file: testImage,
    filename: fileName,
    timestamp: timestamp,
  };

  const startTime = Date.now();

  try {
    const response = http.post(
      `${baseUrl}/api/upload`,
      JSON.stringify(payload),
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "k6-load-test",
        },
        timeout: "30s", // 30 second timeout
      }
    );

    const duration = Date.now() - startTime;

    // Check response
    const success = check(response, {
      "upload successful": (r) => r.status === 200 || r.status === 201,
      "response time reasonable": (r) => r.timings.duration < 30000,
      "has response body": (r) => r.body && r.body.length > 0,
    });

    uploadSuccessRate.add(success);
    uploadDuration.add(duration);

    // Log errors for debugging
    if (!success) {
      console.log(`❌ Upload failed: ${response.status} - ${response.body}`);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  } catch (error) {
    console.log(`💥 Upload error: ${error.message}`);
    errorRate.add(1);
    uploadSuccessRate.add(false);
  }

  // Small delay between requests (simulate user behavior)
  sleep(Math.random() * 2 + 0.5); // 0.5 to 2.5 seconds
}

// Setup function
export function setup() {
  console.log("🔥 Starting upload stress test...");
  console.log(`📊 Target: 20 concurrent users uploading files`);
  console.log(`⏱️  Duration: 5 minutes total`);
  console.log(`🎯 Focus: Upload API performance under load`);
  console.log(`📁 Test files: Minimal 1x1 pixel JPEGs`);
}

// Teardown function
export function teardown(data) {
  console.log("✅ Upload stress test completed!");
  console.log("📈 Check metrics for upload performance insights");
  console.log("💡 Look for bottlenecks in upload processing");
}

