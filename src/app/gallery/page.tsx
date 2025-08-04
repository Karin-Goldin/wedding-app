"use client";

import styled from "styled-components";
import Gallery from "@/components/Gallery";
import { useState } from "react";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const GalleryPageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  position: relative;
  background-image: url("/bg2.svg");
  background-size: 100% auto;
  background-position: top center;
  background-repeat: repeat-y;
  background-color: #faf3eb;

  &::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(250, 243, 235, 0.5);
    z-index: -1;
  }
`;

const GalleryPageContainer = styled.div`
  padding: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Header = styled.div`
  text-align: center;
  margin: 10px 0 40px;
  color: #8b4513;
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
  margin-bottom: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
`;

const Button = styled.button<{ $isDownload?: boolean }>`
  background: ${(props) =>
    props.$isDownload ? "#8B4513" : "rgba(139, 69, 19, 0.1)"};
  color: ${(props) => (props.$isDownload ? "white" : "#8B4513")};
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${(props) =>
      props.$isDownload ? "#A0522D" : "rgba(139, 69, 19, 0.2)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
`;

export default function GalleryPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async () => {
    try {
      setDownloading(true);

      // Get list of all files
      const { data: files, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list();

      if (error) {
        console.error("Error fetching files:", error);
        return;
      }

      // Create a new zip file
      const zip = new JSZip();
      const mediaFolder = zip.folder("wedding-photos");

      if (!mediaFolder) {
        throw new Error("Could not create zip folder");
      }

      // Download each file and add to zip
      const downloadPromises = files.map(async (file) => {
        try {
          // Get the file data
          const { data, error: downloadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download(file.name);

          if (downloadError || !data) {
            console.error("Error downloading file:", file.name, downloadError);
            return;
          }

          // Add file to zip
          mediaFolder.file(file.name, data);
        } catch (err) {
          console.error("Error processing file:", file.name, err);
        }
      });

      // Wait for all downloads to complete
      await Promise.all(downloadPromises);

      // Generate zip file
      const content = await zip.generateAsync({ type: "blob" });

      // Save the zip file
      saveAs(content, "wedding-photos.zip");
    } catch (error) {
      console.error("Error creating zip:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <GalleryPageWrapper>
      <GalleryPageContainer>
        <Header id="gallery-header">
          <ButtonGroup>
            <Button onClick={() => window.history.back()}>
              <svg viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              חזרה
            </Button>
            <Button
              $isDownload
              onClick={handleDownloadAll}
              disabled={downloading}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              {downloading ? "מוריד..." : "הורדת כל התמונות"}
            </Button>
          </ButtonGroup>
          <Title>הזכרונות שלנו איתכם</Title>
        </Header>
        <Gallery />
      </GalleryPageContainer>
    </GalleryPageWrapper>
  );
}
