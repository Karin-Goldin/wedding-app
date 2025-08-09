"use client";

import { useRef, useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import { useUpload } from "@/hooks/useUpload";
import GalleryPreview from "@/components/GalleryPreview";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  z-index: 1;
`;

const HeroImage = styled.div`
  position: relative;
  width: 300px;
  height: 300px;
  margin-bottom: 2rem;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 600px;
`;

const UploadSection = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const UploadIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: rgba(139, 69, 19, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b4513;
  transition: all 0.3s ease;

  ${UploadSection}:hover & {
    background: rgba(139, 69, 19, 0.2);
    transform: scale(1.1);
  }

  svg {
    width: 40px;
    height: 40px;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
  margin-bottom: 0.5rem;
  color: #8b4513;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 0;
  margin-bottom: 1rem;
  color: #666;
`;

const IconText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #8b4513;
  font-weight: 500;

  span {
    font-size: 1.2rem;
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
