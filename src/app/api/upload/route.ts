import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  // Android specific
  "image/x-ms-bmp",
  "image/bmp",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov files
  "video/webm",
  "video/x-m4v",
  "video/hevc", // HEVC/H.265
  "video/h265",
  "video/x-h265",
  // Android specific
  "video/3gpp", // .3gp
  "video/x-matroska", // .mkv
  "video/mpeg", // .mpg, .mpeg
  "video/ogg", // .ogv
  "video/x-msvideo", // .avi
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
    const filename = "name" in file ? file.name : "unnamed-file";
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${filename.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;

    console.log("Preparing to upload file:", safeFileName, "Type:", file.type);

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("wedding-photos")
        .upload(safeFileName, buffer, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json(
          {
            error: "Failed to upload to storage",
            details: uploadError.message,
          },
          { status: 500 }
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("wedding-photos").getPublicUrl(safeFileName);

      console.log("Got public URL:", publicUrl);

      return NextResponse.json({ url: publicUrl });
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      const errorMessage =
        uploadError instanceof Error
          ? uploadError.message
          : "Unknown error occurred";
      return NextResponse.json(
        { error: "Failed to upload to storage", details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
