"use client";

import { useState } from "react";

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

    try {
      const urls = [];
      let completed = 0;

      for (const file of Array.from(files)) {
        try {
          // Validate file before upload
          validateFile(file);

          // Create unique file name
          const timestamp = Date.now();
          const fileExt = file.name.split(".").pop();
          const fileName = `${timestamp}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;

          // Upload to API route
          const formData = new FormData();
          formData.append("file", file);
          formData.append("fileName", fileName);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            console.error("Upload error response:", result);
            throw new Error(result.details || result.error || "Upload failed");
          }

          if (result.url) {
            urls.push(result.url);
            // Update progress
            completed++;
            setProgress((completed / files.length) * 100);
          } else {
            throw new Error("No URL in response");
          }
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
