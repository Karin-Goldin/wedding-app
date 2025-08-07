"use client";

import React, { useRef, useState } from "react";
import styled from "styled-components";
import { useUpload } from "@/hooks/useUpload";
import GalleryPreview from "@/components/GalleryPreview";
import Image from "next/image";

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
`;

const HeroImage = styled.div`
  width: 100%;
  height: 50vh;
  position: relative;
  margin-bottom: 1rem;

  img {
    object-fit: contain !important;
    padding: 0 10px;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 350px;
  padding: 0;
`;

const UploadSection = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
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
  font-size: 1.2rem;
  margin: 0;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #a0522d;
  font-size: 0.85rem;
  margin: 0;
  text-align: center;
`;

const IconText = styled.div`
  color: #a0522d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
`;

const UploadIcon = styled.div`
  width: 40px;
  height: 40px;
  color: #8b4513;
  margin-bottom: 0.4rem;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 4px;
  background: rgba(139, 69, 19, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.4rem;

  &::after {
    content: "";
    display: block;
    width: ${(props) => props.$progress}%;
    height: 100%;
    background: #8b4513;
    transition: width 0.3s ease;
  }
`;

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState(0);
  const { uploadFiles, isUploading, progress, error } = useUpload();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await uploadFiles(event.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setKey((prev) => prev + 1);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="page-container" id="home-page">
      <Container>
        <HeroImage>
          <Image
            src="/hero.png"
            alt="Wedding couple illustration"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </HeroImage>
        <ContentWrapper>
          <UploadSection onClick={handleClick}>
            <FileInput
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              disabled={isUploading}
            />
            <UploadIcon>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
              </svg>
            </UploadIcon>
            <Title>שתפו את הזכרונות שלכם</Title>
            <Subtitle>העלו תמונות וסרטונים מהיום המיוחד שלנו</Subtitle>
            <IconText>
              <span>📸</span>
              תמונות וסרטונים מוזמנים
              <span>❤️</span>
            </IconText>
            {isUploading && <ProgressBar $progress={progress} />}
            {error && (
              <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>
            )}
          </UploadSection>

          <GalleryPreview key={key} />
        </ContentWrapper>
      </Container>
    </div>
  );
}
