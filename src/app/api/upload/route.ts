import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov files
  "video/webm",
  "video/x-m4v",
  "video/hevc", // HEVC/H.265
  "video/h265",
  "video/x-h265",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const firebaseConfig = {
  apiKey: "AIzaSyB06yZDc0fF5KNmxkmjB2qmVq5y0NFYwK_4",
  authDomain: "wedding-app-69c75.firebaseapp.com",
  projectId: "wedding-app-69c75",
  storageBucket: "wedding-app-69c75.appspot.com",
  messagingSenderId: "874337951478",
  appId: "1:874337951478:web:409abe32a7ee500ec5d6d7",
};

// Initialize Firebase only if it hasn't been initialized
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const storage = getStorage(app);

interface UploadError {
  code?: string;
  message: string;
  serverResponse?: string;
}

export async function POST(request: Request) {
  console.log("Starting file upload process...");

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      console.log("No valid file provided");
      return NextResponse.json(
        { error: "No valid file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      !ALLOWED_IMAGE_TYPES.includes(file.type) &&
      !ALLOWED_VIDEO_TYPES.includes(file.type)
    ) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = "file" in file ? file.name : "unnamed-file";
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${filename.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;

    console.log("Preparing to upload file:", safeFileName, "Type:", file.type);

    try {
      // Create reference
      const fileRef = ref(storage, `uploads/${safeFileName}`);
      console.log("Created storage reference");

      // Upload file
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: filename,
          uploadedAt: new Date().toISOString(),
        },
      };

      const uploadResult = await uploadBytes(fileRef, buffer, metadata);
      console.log("File uploaded successfully");

      // Get URL
      const url = await getDownloadURL(uploadResult.ref);
      console.log("Got download URL:", url);

      return NextResponse.json({ url });
    } catch (uploadError: unknown) {
      console.error("Firebase upload error:", uploadError);
      const error = uploadError as UploadError;
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        serverResponse: error.serverResponse,
      });

      return NextResponse.json(
        {
          error: "Failed to upload to storage",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
