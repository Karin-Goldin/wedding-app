import { NextRequest, NextResponse } from "next/server";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_UPLOADS_PER_MINUTE = 50; // Per IP - generous for wedding
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Simple in-memory rate limiting (use Redis in production)
const uploadCounts = new Map<string, { count: number; resetTime: number }>();

function getRateLimitInfo(ip: string) {
  const now = Date.now();
  const userLimit = uploadCounts.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    uploadCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return {
      remaining: MAX_UPLOADS_PER_MINUTE - 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  if (userLimit.count >= MAX_UPLOADS_PER_MINUTE) {
    return { remaining: 0, resetTime: userLimit.resetTime };
  }

  userLimit.count++;
  return {
    remaining: MAX_UPLOADS_PER_MINUTE - userLimit.count,
    resetTime: userLimit.resetTime,
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit
    const rateLimit = getRateLimitInfo(ip);
    if (rateLimit.remaining <= 0) {
      const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error:
            `יותר מדי העלאות. אנא המתן ${waitTime} שניות לפני ניסיון נוסף.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetTime.toString(),
          },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const message = formData.get("message") as string;

    console.log("Upload API - Received message:", message);
    console.log("Upload API - File name:", file?.name);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/x-ms-bmp",
      "image/bmp",
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "video/x-m4v",
      "video/hevc",
      "video/h265",
      "video/x-h265",
      "video/3gpp",
      "video/x-matroska",
      "video/mpeg",
      "video/ogg",
      "video/x-msvideo",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      );
    }

    // Create unique filename (simple, without message)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;

    console.log("Upload API - Creating filename:", fileName);
    console.log("Upload API - Message to store in database:", message);

    // Convert File to Buffer for server-side upload
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage (simple, no metadata)
    const { error: uploadError, data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    console.log("Upload API - Upload successful, data:", data);

    // Store message in database if provided
    if (message && message.trim()) {
      try {
        const { error: dbError } = await supabase.from("file_messages").insert({
          file_name: fileName,
          message: message.trim(),
          uploaded_at: new Date().toISOString(),
        });

        if (dbError) {
          console.error("Database error:", dbError);
          // Don't fail the upload if database insert fails
        } else {
          console.log("Message stored in database successfully");
        }
      } catch (error) {
        console.error("Error storing message in database:", error);
      }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

    return NextResponse.json(
      {
        url: publicUrl,
        fileName,
        size: file.size,
        type: file.type,
        message: message && message.trim() ? message.trim() : null,
      },
      {
        headers: {
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.resetTime.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
