"use client";

import { useEffect, useState, useCallback } from "react";
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlayIcon = styled.div`
  width: 60px;
  height: 60px;
  background: #8b4513;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;

  svg {
    width: 30px;
    height: 30px;
    fill: white;
    margin-left: 4px;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  svg {
    width: 20px;
    height: 20px;
    fill: #e74c3c;
  }

  &:hover {
    background: white;
  }
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ConfirmContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  max-width: 90%;
  width: 300px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ConfirmText = styled.p`
  color: #333;
  margin: 0;
  font-size: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const Button = styled.button<{ $isDelete?: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$isDelete
      ? `
    background: #e74c3c;
    color: white;
    &:hover {
      background: #c0392b;
    }
  `
      : `
    background: #eee;
    color: #333;
    &:hover {
      background: #ddd;
    }
  `}
`;

interface VideoThumbnailProps {
  url: string;
  onLoad?: () => void;
}

function VideoThumbnail({ url, onLoad }: VideoThumbnailProps) {
  useEffect(() => {
    // Notify that we're ready immediately
    onLoad?.();
  }, [onLoad]);

  return (
    <VideoPreview>
      <PlayIcon>
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </PlayIcon>
    </VideoPreview>
  );
}

export default function Gallery() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

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

  const handleDelete = async (url: string) => {
    if (deleting) return; // Prevent multiple deletes at once

    try {
      setDeleting(true);
      // Extract filename from URL
      const filename = url.split("/").pop();
      if (!filename) return;

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filename]);

      if (error) {
        console.error("Error deleting file:", error);
        return;
      }

      // Refresh the file list
      loadFiles();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDeleting(false);
      setFileToDelete(null);
    }
  };

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

  if (loading) {
    return <div>טוען תמונות...</div>;
  }

  if (files.length === 0) {
    return null; // Empty state is handled by EmptyState component
  }

  return (
    <>
      <GalleryContainer>
        {files.map((url) => (
          <ImageCard key={url}>
            <DeleteButton
              onClick={(e) => {
                e.stopPropagation();
                setFileToDelete(url);
              }}
              disabled={deleting}
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </DeleteButton>
            <div
              onClick={() => setSelectedMedia(url)}
              style={{ width: "100%", height: "100%" }}
            >
              {isVideo(url) ? (
                <VideoPreview>
                  <PlayIcon>
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </PlayIcon>
                </VideoPreview>
              ) : (
                <Image
                  src={url}
                  alt="Wedding photo"
                  width={400}
                  height={400}
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
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

      {fileToDelete && (
        <ConfirmDialog
          onClick={(e) => {
            // Close dialog when clicking outside
            if (e.target === e.currentTarget) {
              setFileToDelete(null);
            }
          }}
        >
          <ConfirmContent>
            <ConfirmText>האם למחוק את התמונה?</ConfirmText>
            <ButtonGroup>
              <Button onClick={() => setFileToDelete(null)}>ביטול</Button>
              <Button
                $isDelete
                onClick={() => handleDelete(fileToDelete)}
                disabled={deleting}
              >
                {deleting ? "מוחק..." : "מחיקה"}
              </Button>
            </ButtonGroup>
          </ConfirmContent>
        </ConfirmDialog>
      )}
    </>
  );
}
