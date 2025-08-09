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

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s;

  &:hover {
    background: white;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  font-size: 1.1rem;
  color: #666;
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

const PasswordDialog = styled(ConfirmDialog)`
  // Inherits styles from ConfirmDialog
`;

const PasswordInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  margin-top: 8px;
  text-align: center;

  &:focus {
    outline: none;
    border-color: #8b4513;
  }
`;

const ErrorText = styled.p`
  color: #e74c3c;
  margin: 8px 0 0;
  font-size: 0.9rem;
`;

interface FileInfo {
  url: string;
  uploadTime: number;
  name: string;
}

const DELETE_WINDOW_MINUTES = 5;
const FILES_PER_PAGE = 20; // Load 20 files at a time

export default function Gallery() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const loadFiles = useCallback(async (offset = 0, limit = FILES_PER_PAGE) => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list("", {
          limit,
          offset,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        console.error("Error loading files:", error);
        return [];
      }

      // Get public URLs and creation times for files
      const filesInfo = await Promise.all(
        data.map(async (file) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(file.name);

          return {
            url: publicUrl,
            uploadTime: new Date(file.created_at || Date.now()).getTime(),
            name: file.name,
          };
        })
      );

      return filesInfo;
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }, []);

  const loadInitialFiles = useCallback(async () => {
    setLoading(true);
    const initialFiles = await loadFiles(0, FILES_PER_PAGE);
    setFiles(initialFiles);
    setHasMore(initialFiles.length === FILES_PER_PAGE);
    setLoading(false);
  }, [loadFiles]);

  const loadMoreFiles = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const moreFiles = await loadFiles(files.length, FILES_PER_PAGE);

    if (moreFiles.length > 0) {
      setFiles((prev) => [...prev, ...moreFiles]);
      setHasMore(moreFiles.length === FILES_PER_PAGE);
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [loadFiles, files.length, loadingMore, hasMore]);

  const canDeleteWithoutPassword = (uploadTime: number) => {
    const now = Date.now();
    const minutesSinceUpload = (now - uploadTime) / (1000 * 60);
    return minutesSinceUpload <= DELETE_WINDOW_MINUTES;
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Password verification failed:", error);
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  };

  const handleDelete = async (url: string, providedPassword?: string) => {
    if (deleting) return;

    try {
      const fileInfo = files.find((f) => f.url === url);
      if (!fileInfo) return;

      // Check if we need password
      const needsPassword = !canDeleteWithoutPassword(fileInfo.uploadTime);

      if (needsPassword) {
        if (!providedPassword) {
          setShowPasswordDialog(true);
          return;
        }

        setVerifyingPassword(true);
        const isValid = await verifyPassword(providedPassword);
        setVerifyingPassword(false);

        if (!isValid) {
          setPasswordError("סיסמה שגויה");
          return;
        }
      }

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

      // Remove from local state instead of reloading all files
      setFiles((prev) => prev.filter((f) => f.url !== url));
      setShowPasswordDialog(false);
      setPassword("");
      setPasswordError("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDeleting(false);
      setFileToDelete(null);
    }
  };

  useEffect(() => {
    loadInitialFiles();

    // Enable real-time subscription for storage events
    const channel = supabase
      .channel("storage-changes")
      .on("presence", { event: "sync" }, () => {
        console.log("Presence sync");
      })
      .on("broadcast", { event: "storage-update" }, () => {
        console.log("Storage update received");
        // Only reload initial files on storage updates
        loadInitialFiles();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to storage changes");
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [loadInitialFiles]);

  const isVideo = (url: string) => {
    return /\.(mp4|mov|webm|3gp|mkv|mpeg|ogv|avi)$/i.test(url);
  };

  if (loading) {
    return <LoadingSpinner>טוען תמונות...</LoadingSpinner>;
  }

  if (files.length === 0) {
    return <LoadingSpinner>אין תמונות עדיין</LoadingSpinner>;
  }

  return (
    <>
      <GalleryContainer>
        {files.map((fileInfo) => (
          <ImageCard key={fileInfo.url}>
            <DeleteButton
              onClick={(e) => {
                e.stopPropagation();
                setFileToDelete(fileInfo.url);
                if (!canDeleteWithoutPassword(fileInfo.uploadTime)) {
                  setShowPasswordDialog(true);
                }
              }}
              disabled={deleting}
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </DeleteButton>
            <div
              onClick={() => setSelectedMedia(fileInfo.url)}
              style={{ width: "100%", height: "100%" }}
            >
              {isVideo(fileInfo.url) ? (
                <VideoPreview>
                  <PlayIcon>
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </PlayIcon>
                </VideoPreview>
              ) : (
                <Image
                  src={fileInfo.url}
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

      {hasMore && (
        <LoadMoreButton onClick={loadMoreFiles} disabled={loadingMore}>
          {loadingMore ? "טוען עוד..." : "טען עוד תמונות"}
        </LoadMoreButton>
      )}

      {selectedMedia && (
        <MediaModal
          url={selectedMedia}
          isVideo={isVideo(selectedMedia)}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {fileToDelete && !showPasswordDialog && (
        <ConfirmDialog
          onClick={(e) => {
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

      {showPasswordDialog && fileToDelete && (
        <PasswordDialog
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordDialog(false);
              setFileToDelete(null);
              setPassword("");
              setPasswordError("");
            }
          }}
        >
          <ConfirmContent>
            <ConfirmText>נדרשת סיסמה למחיקת תמונה זו</ConfirmText>
            <PasswordInput
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="הזן סיסמה"
              autoFocus
            />
            {passwordError && <ErrorText>{passwordError}</ErrorText>}
            <ButtonGroup>
              <Button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setFileToDelete(null);
                  setPassword("");
                  setPasswordError("");
                }}
              >
                ביטול
              </Button>
              <Button
                $isDelete
                onClick={() => handleDelete(fileToDelete, password)}
                disabled={deleting || verifyingPassword || !password}
              >
                {deleting ? "מוחק..." : verifyingPassword ? "בודק..." : "מחיקה"}
              </Button>
            </ButtonGroup>
          </ConfirmContent>
        </PasswordDialog>
      )}
    </>
  );
}
