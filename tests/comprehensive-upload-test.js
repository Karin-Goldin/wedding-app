import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const uploadSuccessRate = new Rate("upload_success");
const rateLimitRate = new Rate("rate_limit_hits");

export const options = {
  stages: [
    { duration: "20s", target: 3 }, // Ramp up to 3 users
    { duration: "1m", target: 3 }, // Stay at 3 users for 1 minute
    { duration: "20s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<10000"], // 95% of requests should be below 10s
    http_req_failed: ["rate<0.2"], // Error rate should be less than 20%
    upload_success: ["rate>0.7"], // At least 70% upload success rate
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Create different file types and sizes
function createMockFile(type, size, name) {
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type });
  return { blob, name, size };
}

// Generate realistic file data
function generateFileData(size) {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }
  return data;
}

export default function () {
  const userId = Math.random().toString(36).substr(2, 6);
  const timestamp = Date.now();

  // Different file types and sizes to test
  const fileTypes = [
    { type: "image/jpeg", size: 2 * 1024 * 1024, name: "photo_2mb.jpg" }, // 2MB photo
    { type: "image/png", size: 5 * 1024 * 1024, name: "photo_5mb.png" }, // 5MB photo
    { type: "video/mp4", size: 15 * 1024 * 1024, name: "video_15mb.mp4" }, // 15MB video
    { type: "image/jpeg", size: 8 * 1024 * 1024, name: "photo_8mb.jpg" }, // 8MB photo
    { type: "video/mp4", size: 25 * 1024 * 1024, name: "video_25mb.mp4" }, // 25MB video
  ];

  const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];

  try {
    // Create mock file data
    const fileData = generateFileData(fileType.size);
    const blob = new Blob([fileData], { type: fileType.type });

    // Create FormData for upload
    const formData = new FormData();
    formData.append("file", blob, fileType.name);

    // Upload file
    const uploadResponse = http.post(`${BASE_URL}/api/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: "30s", // 30 second timeout for large files
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
        `✅ Upload successful: ${fileType.name} (${
          fileType.size / (1024 * 1024)
        }MB)`
      );
    } else if (uploadResponse.status === 429) {
      rateLimitRate.add(1);
      console.log(`⏰ Rate limit hit: ${fileType.name}`);
    } else {
      console.log(
        `❌ Upload failed: ${uploadResponse.status} - ${uploadResponse.body}`
      );
    }
  } catch (error) {
    console.log(`❌ Upload error: ${error.message}`);
  }

  // Test storage usage after upload
  const storageResponse = http.get(`${BASE_URL}/api/storage-usage`);

  check(storageResponse, {
    "storage API status is 200": (r) => r.status === 200,
    "storage API response time < 2s": (r) => r.timings.duration < 2000,
  });

  // Random delay between 2-8 seconds (realistic upload intervals)
  sleep(Math.random() * 6 + 2);
}
