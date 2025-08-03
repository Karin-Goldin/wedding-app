"use client";

import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import Image from "next/image";

const GalleryContainer = styled.div`
  width: 100%;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const ImageCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }

  img,
  video {
    width: 100%;
    height: 250px;
    object-fit: cover;
  }
`;

interface GalleryProps {
  onLoad?: (hasFiles: boolean) => void;
}

export default function Gallery() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list();

      if (error) {
        console.error("Error loading files:", error);
        return;
      }

      // Get public URLs for all files
      const urls = await Promise.all(
        data.map((file) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(file.name);
          return publicUrl;
        })
      );

      setFiles(urls);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const isVideo = (url: string) => {
    return /\.(mp4|mov|webm)$/i.test(url);
  };

  if (loading) {
    return <div>טוען תמונות...</div>;
  }

  if (files.length === 0) {
    return null; // Empty state is handled by EmptyState component
  }

  return (
    <GalleryContainer>
      {files.map((url) => (
        <ImageCard key={url}>
          {isVideo(url) ? (
            <video controls>
              <source src={url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <Image
              src={url}
              alt="Wedding photo"
              width={300}
              height={300}
              style={{ objectFit: "cover" }}
            />
          )}
        </ImageCard>
      ))}
    </GalleryContainer>
  );
}
