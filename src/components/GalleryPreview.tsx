"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

const PreviewCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 0.8rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
  }
`;

const Title = styled.h2`
  color: #8b4513;
  font-size: 1.1rem;
  margin: 0;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #a0522d;
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  width: 100%;
  margin: 4px 0;
`;

const PreviewImage = styled.div<{ $url: string }>`
  width: 100%;
  padding-bottom: 70%;
  background-image: url(${(props) => props.$url});
  background-size: cover;
  background-position: center;
  border-radius: 6px;
`;

const ViewAllButton = styled.button`
  background: #8b4513;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-top: 2px;

  &:hover {
    background: #a0522d;
  }
`;

const EmptyState = styled(PreviewCard)`
  cursor: default;

  &:hover {
    transform: none;
  }
`;

const CameraIcon = styled.div`
  width: 35px;
  height: 35px;
  color: #a0522d;
  margin: 0.3rem 0;

  svg {
    width: 100%;
    height: 100%;
  }
`;

export default function GalleryPreview() {
  const [totalFiles, setTotalFiles] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list();

      if (error) {
        console.error("Error loading files:", error);
        return;
      }

      // Store total count
      setTotalFiles(data.length);

      // Get public URLs for only the first 2 files
      const urls = await Promise.all(
        data.slice(0, 2).map((file) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(file.name);
          return publicUrl;
        })
      );

      setPreviewUrls(urls);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
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
  }, []);

  if (loading) {
    return null;
  }

  if (totalFiles === 0) {
    return (
      <EmptyState>
        <CameraIcon>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-1 6l1.25-2.75L15 14l2.75-1.25L19 10l-1.25-2.75L15 6l-2.75-1.25L9 6 7.75 8.75 6 10l1.25 2.75L9 14l2.75 1.25L12 18zm7-6c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6 6 2.69 6 6z" />
          </svg>
        </CameraIcon>
        <Title>עדיין אין זכרונות משותפים</Title>
        <Subtitle>היו הראשונים לשתף רגעים מהיום המיוחד!</Subtitle>
      </EmptyState>
    );
  }

  return (
    <PreviewCard onClick={() => router.push("/gallery")}>
      <Title>הזכרונות שלנו</Title>
      <Subtitle>{totalFiles} תמונות שותפו עד כה</Subtitle>
      <PreviewGrid>
        {previewUrls.map((url, index) => (
          <PreviewImage key={url} $url={url} />
        ))}
      </PreviewGrid>
      <ViewAllButton>צפו בכל התמונות</ViewAllButton>
    </PreviewCard>
  );
}
