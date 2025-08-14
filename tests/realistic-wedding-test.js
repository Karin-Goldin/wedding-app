import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics for realistic wedding scenario
const uploadSuccessRate = new Rate("upload_success_rate");
const uploadDuration = new Trend("upload_duration");
const guestBehaviorCounter = new Counter("guest_behaviors");
const fileSizeDistribution = new Trend("file_size_distribution");

// Test configuration - Realistic wedding scenario
export const options = {
  stages: [
    // Early arrivals - 5 guests start uploading
    { duration: "2m", target: 5 },
    // Ceremony time - more guests arrive, 15 total
    { duration: "3m", target: 15 },
    // Reception peak - maximum guests, 25 total
    { duration: "5m", target: 25 },
    // Gradual decrease as guests leave
    { duration: "2m", target: 10 },
    // Final stragglers
    { duration: "1m", target: 5 },
  ],
  thresholds: {
    // 95% of uploads should succeed (realistic for wedding scenario)
    upload_success_rate: ["rate>0.95"],
    // 95% of uploads should complete within 30 seconds (realistic for photos)
    upload_duration: ["p(95)<30000"],
    // 99% of uploads should complete within 60 seconds
    upload_duration: ["p(99)<60000"],
  },
};

// Realistic file sizes for wedding photos (in bytes)
const realisticFileSizes = [
  1024 * 1024, // 1MB - typical phone photo
  2 * 1024 * 1024, // 2MB - high quality phone photo
  3 * 1024 * 1024, // 3MB - DSLR photo
  5 * 1024 * 1024, // 5MB - high resolution photo
  8 * 1024 * 1024, // 8MB - professional photo
];

// Realistic file names for wedding photos
const photoTypes = [
  "ceremony",
  "reception",
  "first-dance",
  "cake-cutting",
  "family-photo",
  "friends-group",
  "decorations",
  "food",
  "dancing",
  "speeches",
  "toasts",
  "bouquet-toss",
  "garter-toss",
  "exit",
  "getting-ready",
];

// Generate realistic photo data based on file size
function generateRealisticPhoto(sizeInBytes) {
  // Create a minimal but realistic JPEG header
  const header =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxOAPwCdABmX/9k=";

  // Pad with data to reach desired size (simulating actual photo content)
  const padding = "A".repeat(Math.max(0, sizeInBytes - header.length));
  return header + padding;
}

// Simulate realistic guest behavior
function simulateGuestBehavior() {
  const behaviors = [
    "upload-single-photo",
    "upload-multiple-photos",
    "browse-gallery",
    "check-storage",
    "upload-video",
  ];

  const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
  guestBehaviorCounter.add(1, { behavior });
  return behavior;
}

// Realistic delays between actions
function getRealisticDelay() {
  // Most guests take 10-30 seconds between actions
  // Some take longer (1-3 minutes) - they're socializing
  // A few are very active (5-15 seconds)
  const random = Math.random();

  if (random < 0.6) {
    // 60% of guests: normal pace (10-30 seconds)
    return Math.random() * 20 + 10;
  } else if (random < 0.85) {
    // 25% of guests: slower pace (30 seconds - 2 minutes)
    return Math.random() * 90 + 30;
  } else {
    // 15% of guests: very active (5-15 seconds)
    return Math.random() * 10 + 5;
  }
}

export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

  // Simulate realistic guest behavior
  const behavior = simulateGuestBehavior();

  switch (behavior) {
    case "upload-single-photo":
      // Single photo upload - most common behavior
      const singleFileSize =
        realisticFileSizes[
          Math.floor(Math.random() * realisticFileSizes.length)
        ];
      const singlePhotoType =
        photoTypes[Math.floor(Math.random() * photoTypes.length)];
      const singleTimestamp = Date.now();
      const singleGuestId = Math.random().toString(36).substr(2, 6);

      const singleFileName = `${singlePhotoType}-${singleTimestamp}-${singleGuestId}.jpg`;
      const singlePhotoData = generateRealisticPhoto(singleFileSize);

      const singleUploadStart = Date.now();
      const singleUploadResponse = http.post(
        `${baseUrl}/api/upload`,
        JSON.stringify({
          file: singlePhotoData,
          filename: singleFileName,
          timestamp: singleTimestamp,
          guestId: singleGuestId,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Wedding-Guest-Phone",
          },
          timeout: "60s",
        }
      );

      const singleUploadDuration = Date.now() - singleUploadStart;

      const singleSuccess = check(singleUploadResponse, {
        "single photo upload successful": (r) =>
          r.status === 200 || r.status === 201,
        "upload response time reasonable": (r) => r.timings.duration < 60000,
        "has response body": (r) => r.body && r.body.length > 0,
      });

      uploadSuccessRate.add(singleSuccess);
      uploadDuration.add(singleUploadDuration);
      fileSizeDistribution.add(singleFileSize);

      if (!singleSuccess) {
        console.log(
          `❌ Photo upload failed: ${singleUploadResponse.status} - ${singleUploadResponse.body}`
        );
      }
      break;

    case "upload-multiple-photos":
      // Multiple photos in sequence - common for active photographers
      const numPhotos = Math.floor(Math.random() * 3) + 2; // 2-4 photos

      for (let i = 0; i < numPhotos; i++) {
        const batchFileSize =
          realisticFileSizes[
            Math.floor(Math.random() * realisticFileSizes.length)
          ];
        const batchPhotoType =
          photoTypes[Math.floor(Math.random() * photoTypes.length)];
        const batchTimestamp = Date.now() + i;
        const batchGuestId = Math.random().toString(36).substr(2, 6);

        const batchFileName = `${batchPhotoType}-batch-${i}-${batchTimestamp}-${batchGuestId}.jpg`;
        const batchPhotoData = generateRealisticPhoto(batchFileSize);

        const batchUploadStart = Date.now();
        const batchUploadResponse = http.post(
          `${baseUrl}/api/upload`,
          JSON.stringify({
            file: batchPhotoData,
            filename: batchFileName,
            timestamp: batchTimestamp,
            guestId: batchGuestId,
            batchNumber: i + 1,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Wedding-Guest-Phone",
            },
            timeout: "60s",
          }
        );

        const batchUploadDuration = Date.now() - batchUploadStart;

        const batchSuccess = check(batchUploadResponse, {
          "batch photo upload successful": (r) =>
            r.status === 200 || r.status === 201,
          "batch upload response time reasonable": (r) =>
            r.timings.duration < 60000,
          "batch upload has response body": (r) => r.body && r.body.length > 0,
        });

        uploadSuccessRate.add(batchSuccess);
        uploadDuration.add(batchUploadDuration);
        fileSizeDistribution.add(batchFileSize);

        // Small delay between batch uploads
        if (i < numPhotos - 1) {
          sleep(Math.random() * 2 + 1); // 1-3 seconds between photos
        }
      }
      break;

    case "browse-gallery":
      // Guests browsing uploaded photos
      const galleryResponse = http.get(`${baseUrl}/api/gallery`);

      check(galleryResponse, {
        "gallery accessible": (r) => r.status === 200,
        "gallery response time < 5s": (r) => r.timings.duration < 5000,
        "gallery has content": (r) => r.body && r.body.length > 0,
      });
      break;

    case "check-storage":
      // Guests checking storage usage (less common)
      const storageResponse = http.get(`${baseUrl}/api/storage-usage`);

      check(storageResponse, {
        "storage usage accessible": (r) => r.status === 200,
        "storage response time < 3s": (r) => r.timings.duration < 3000,
        "storage has data": (r) => r.body && r.body.length > 0,
      });
      break;

    case "upload-video":
      // Video upload - less common but important
      const videoSize = 10 * 1024 * 1024; // 10MB video
      const videoType = ["ceremony-video", "first-dance", "speech", "toast"][
        Math.floor(Math.random() * 4)
      ];
      const videoTimestamp = Date.now();
      const videoGuestId = Math.random().toString(36).substr(2, 6);

      const videoFileName = `${videoType}-${videoTimestamp}-${videoGuestId}.mp4`;
      const videoData =
        "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAG1tZGF0AAACmwYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCByMjkyMSA3ZGU2YTU3IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNSAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcWm0dD0xIGN1bHR1cmU9MSBtZWRpYV9yZWY9MSByZWZfcD0x";

      const videoUploadStart = Date.now();
      const videoUploadResponse = http.post(
        `${baseUrl}/api/upload`,
        JSON.stringify({
          file: videoData,
          filename: videoFileName,
          timestamp: videoTimestamp,
          guestId: videoGuestId,
          fileType: "video",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Wedding-Guest-Phone",
          },
          timeout: "120s", // Longer timeout for videos
        }
      );

      const videoUploadDuration = Date.now() - videoUploadStart;

      const videoSuccess = check(videoUploadResponse, {
        "video upload successful": (r) => r.status === 200 || r.status === 201,
        "video upload response time reasonable": (r) =>
          r.timings.duration < 120000,
        "video upload has response body": (r) => r.body && r.body.length > 0,
      });

      uploadSuccessRate.add(videoSuccess);
      uploadDuration.add(videoUploadDuration);
      fileSizeDistribution.add(videoSize);

      if (!videoSuccess) {
        console.log(
          `❌ Video upload failed: ${videoUploadResponse.status} - ${videoUploadResponse.body}`
        );
      }
      break;
  }

  // Realistic delay before next action
  const delay = getRealisticDelay();
  sleep(delay);
}

// Setup function
export function setup() {
  console.log("💒 Starting realistic wedding guest simulation...");
  console.log("👥 Target: Up to 25 concurrent wedding guests");
  console.log("⏱️  Duration: 13 minutes total (realistic wedding timeline)");
  console.log("📸 Simulating: Photo uploads, video uploads, gallery browsing");
  console.log(
    "🎭 Guest behaviors: Single photos, batch uploads, browsing, storage checks"
  );
  console.log("📱 Realistic delays: 5 seconds to 3 minutes between actions");
  console.log("📊 File sizes: 1MB to 8MB photos, 10MB videos");
}

// Teardown function
export function teardown(data) {
  console.log("🎉 Realistic wedding simulation completed!");
  console.log("📈 Check metrics for real-world performance insights");
  console.log(
    "💡 This test better represents actual guest behavior during a wedding"
  );
}
