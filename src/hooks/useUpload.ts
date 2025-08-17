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
  // Additional formats
  "image/tiff",
  "image/tif",
  "image/svg+xml",
  "image/avif",
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
  // Additional formats
  "video/x-flv", // Flash video
  "video/x-ms-wmv", // Windows Media
  "video/x-ms-asf", // Advanced Systems Format
  "video/3gpp2", // .3g2
  "video/x-matroska-3d", // 3D MKV
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
// New: enforce short clips only
const MAX_VIDEO_DURATION_SECONDS = 20; // ~20s clips
const isVideoType = (type: string) => ALLOWED_VIDEO_TYPES.includes(type);

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration || 0);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("לא ניתן לקרוא את פרטי הווידאו"));
      };
      video.src = url;
    } catch (e) {
      reject(e as Error);
    }
  });
}

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    // More robust file type checking
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Check if file type is in our allowed lists
    const isAllowedType = ALLOWED_IMAGE_TYPES.includes(fileType) || ALLOWED_VIDEO_TYPES.includes(fileType);
    
    // If MIME type doesn't match, try to infer from file extension
    if (!isAllowedType) {
      const extension = fileName.split('.').pop();
      const extensionToMimeType: { [key: string]: string[] } = {
        'jpg': ['image/jpeg'],
        'jpeg': ['image/jpeg'],
        'png': ['image/png'],
        'gif': ['image/gif'],
        'webp': ['image/webp'],
        'heic': ['image/heic'],
        'heif': ['image/heif'],
        'bmp': ['image/bmp', 'image/x-ms-bmp'],
        'tiff': ['image/tiff'],
        'tif': ['image/tiff'],
        'svg': ['image/svg+xml'],
        'avif': ['image/avif'],
        'mp4': ['video/mp4'],
        'mov': ['video/quicktime'],
        'webm': ['video/webm'],
        'm4v': ['video/x-m4v'],
        '3gp': ['video/3gpp'],
        '3g2': ['video/3gpp2'],
        'mkv': ['video/x-matroska'],
        'mpg': ['video/mpeg'],
        'mpeg': ['video/mpeg'],
        'ogv': ['video/ogg'],
        'avi': ['video/x-msvideo'],
        'flv': ['video/x-flv'],
        'wmv': ['video/x-ms-wmv'],
        'asf': ['video/x-ms-asf']
      };
      
      const allowedMimeTypes = extensionToMimeType[extension || ''] || [];
      if (allowedMimeTypes.length > 0) {
        console.log(`File type mismatch: ${fileType} for ${fileName}, but extension suggests: ${allowedMimeTypes.join(', ')}`);
        // Allow the file to proceed if extension matches
        return;
      }
    }
    
    if (!isAllowedType) {
      throw new Error(
        `סוג קובץ לא נתמך: ${file.name} (${fileType}). הקבצים הנתמכים הם: JPEG, PNG, GIF, WEBP, HEIC/HEIF, BMP, TIFF, SVG, AVIF, MP4 (כולל HEVC), MOV, WEBM, 3GP, MKV, AVI, WMV, FLV. קבצים גדולים (מעל 10MB) יועלו ישירות.`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("הקובץ גדול מדי. הגודל המקסימלי הוא 50MB");
    }
  };

  const uploadFiles = async (files: FileList | null, message?: string) => {
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

          // If this is a video, read metadata and enforce max duration (~20s)
          if (isVideoType(file.type)) {
            const durationSec = await getVideoDuration(file);
            if (durationSec > MAX_VIDEO_DURATION_SECONDS + 1) {
              // +1s tolerance for metadata rounding
              throw new Error(
                `הווידאו ארוך מדי (${Math.round(
                  durationSec
                )} שניות). המקסימום המותר הוא ~${MAX_VIDEO_DURATION_SECONDS} שניות`
              );
            }
          }

          // Create FormData for the API
          const formData = new FormData();
          formData.append("file", file);
          if (message && message.trim()) {
            formData.append("message", message.trim());
            console.log(
              "Upload hook - Adding message to FormData:",
              message.trim()
            );
          } else {
            console.log("Upload hook - No message to add");
          }

          // Check if file is large (>10MB) - use direct Supabase upload
          const isLargeFile = file.size > 10 * 1024 * 1024; // 10MB
          
          if (isLargeFile) {
            console.log("Upload hook - Large file detected, using direct Supabase upload");
            
            // Direct Supabase upload for large files
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const fileExt = file.name.split(".").pop();
            const fileName = `${timestamp}-${randomString}.${fileExt}`;
            
            const { error: uploadError, data } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type,
              });

            if (uploadError) {
              console.error("Direct upload error:", uploadError);
              throw new Error(`Upload failed: ${uploadError.message}`);
            }

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
                } else {
                  console.log("Message stored in database successfully");
                }
              } catch (error) {
                console.error("Error storing message in database:", error);
              }
            }

            const { data: { publicUrl } } = supabase.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(fileName);

            urls.push(publicUrl);
          } else {
            // Use API route for smaller files
            console.log("Upload hook - Small file, using API route");
            
            // Upload via API route
            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Upload failed for ${file.name}:`, {
                status: response.status,
                statusText: response.statusText,
                error: errorData,
                fileType: file.type,
                fileSize: file.size
              });

              if (response.status === 429) {
                // Rate limit exceeded
                const resetTime = response.headers.get("X-RateLimit-Reset");
                const waitTime = resetTime
                  ? Math.ceil((parseInt(resetTime) - Date.now()) / 1000)
                  : 60;
                throw new Error(
                  `יותר מדי העלאות. אנא המתן ${waitTime} שניות לפני ניסיון נוסף.`
                );
              }

              throw new Error(errorData.error || "שגיאה בהעלאת הקובץ");
            }

            const data = await response.json();
            urls.push(data.url);
          }

          // Dispatch performance event
          window.dispatchEvent(new CustomEvent("upload-success"));

          // Update progress
          completed++;
          setProgress((completed / files.length) * 100);
        } catch (err) {
          console.error("Error uploading file:", err);
          setError(err instanceof Error ? err.message : "שגיאה בהעלאת הקובץ");

          // Dispatch error event
          window.dispatchEvent(new CustomEvent("upload-error"));

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
    maxVideoDurationSeconds: MAX_VIDEO_DURATION_SECONDS,
  };
};
