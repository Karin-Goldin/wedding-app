"use client";

import { useState } from "react";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

// Define allowed file types
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

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    if (
      !ALLOWED_IMAGE_TYPES.includes(file.type) &&
      !ALLOWED_VIDEO_TYPES.includes(file.type)
    ) {
      throw new Error(
        `סוג קובץ לא נתמך. הקבצים הנתמכים הם: JPEG, PNG, GIF, WEBP, HEIC/HEIF, BMP, MP4 (כולל HEVC), MOV, WEBM, 3GP, MKV, AVI`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("הקובץ גדול מדי. הגודל המקסימלי הוא 50MB");
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setError("לא נבחרו קבצים");
      return [];
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    const urls: string[] = [];
    let completed = 0;

    try {
      for (const file of Array.from(files)) {
        try {
          // Validate file before upload
          validateFile(file);

          // Create a unique file name
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const fileExt = file.name.split(".").pop();
          const fileName = `${timestamp}-${randomString}.${fileExt}`;

          // Upload directly to Supabase Storage
          const { error: uploadError, data } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error(uploadError.message);
          }

          // Get the public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

          urls.push(publicUrl);

          // Update progress
          completed++;
          setProgress((completed / files.length) * 100);
        } catch (err) {
          console.error("Error uploading file:", err);
          setError(err instanceof Error ? err.message : "שגיאה בהעלאת הקובץ");
          // Continue with other files
        }
      }

      if (urls.length === 0) {
        setError("לא הצלחנו להעלות אף קובץ");
      } else if (urls.length < files.length) {
        setError("חלק מהקבצים לא הועלו בהצלחה");
      }

      return urls;
    } catch (err) {
      console.error("Upload error:", err);
      setError("שגיאה בהעלאת הקבצים");
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFiles,
    isUploading,
    progress,
    error,
    allowedTypes: {
      images: ALLOWED_IMAGE_TYPES,
      videos: ALLOWED_VIDEO_TYPES,
    },
    maxFileSize: MAX_FILE_SIZE,
  };
};
