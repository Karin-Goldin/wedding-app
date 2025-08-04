"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import Image from "next/image";
import MediaModal from "./MediaModal";

const GalleryContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
`;

const ImageCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  aspect-ratio: 1;
  cursor: pointer;
  position: relative;

  &:hover {
    transform: translateY(-5px);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoPreview = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: rgba(255, 255, 255, 0.1);

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: url("/karin&sandy.png") center center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }

  svg {
    width: 32px;
    height: 32px;
    fill: #8b4513;
    position: relative;
    z-index: 1;
  }
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const PlayIcon = styled.div`
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  svg {
    width: 24px;
    height: 24px;
    fill: #8b4513;
    margin-left: 4px;
  }
`;

interface VideoThumbnailProps {
  url: string;
  onLoad?: () => void;
}

function VideoThumbnail({ url, onLoad }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      video.currentTime = 0.1; // Start a bit later to avoid black frame
      onLoad?.();
    };

    video.addEventListener("loadeddata", handleLoadedData);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [url, onLoad]);

  return (
    <VideoPreview>
      <video
        ref={videoRef}
        src={url}
        preload="metadata"
        muted
        playsInline
        style={{ opacity: 1 }} // Make video visible
      />
    </VideoPreview>
  );
}

export default function Gallery() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [loadedThumbnails, setLoadedThumbnails] = useState(0);

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
      // Reset thumbnail counter when files change
      setLoadedThumbnails(0);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();

    // Enable real-time subscription for storage events
    const channel = supabase
      .channel("storage-changes")
      .on("presence", { event: "sync" }, () => {
        console.log("Presence sync");
      })
      .on("broadcast", { event: "storage-update" }, () => {
        console.log("Storage update received");
        loadFiles();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to storage changes");
        }
      });

    // Also set up a periodic refresh as a backup
    const refreshInterval = setInterval(loadFiles, 5000);

    return () => {
      channel.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [loadFiles]);

  const isVideo = (url: string) => {
    return /\.(mp4|mov|webm|3gp|mkv|mpeg|ogv|avi)$/i.test(url);
  };

  const handleThumbnailLoad = useCallback(() => {
    setLoadedThumbnails((prev) => prev + 1);
  }, []);

  if (loading) {
    return <div>טוען תמונות...</div>;
  }

  if (files.length === 0) {
    return null; // Empty state is handled by EmptyState component
  }

  // Remove this check to show content immediately
  // const videoCount = files.filter((url) => isVideo(url)).length;
  // if (videoCount > 0 && loadedThumbnails < videoCount) {
  //   return <div>מכין תצוגה מקדימה לסרטונים...</div>;
  // }

  return (
    <>
      <GalleryContainer>
        {files.map((url) => (
          <ImageCard key={url} onClick={() => setSelectedMedia(url)}>
            {isVideo(url) ? (
              <>
                <VideoThumbnail url={url} onLoad={handleThumbnailLoad} />
                <VideoOverlay>
                  <PlayIcon>
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </PlayIcon>
                </VideoOverlay>
              </>
            ) : (
              <Image
                src={url}
                alt="Wedding photo"
                width={400}
                height={400}
                style={{ objectFit: "cover" }}
              />
            )}
          </ImageCard>
        ))}
      </GalleryContainer>

      {selectedMedia && (
        <MediaModal
          url={selectedMedia}
          isVideo={isVideo(selectedMedia)}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </>
  );
}
