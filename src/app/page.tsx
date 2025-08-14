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
  padding: 15px;
  position: relative;
  z-index: 1;
`;

const HeroImage = styled.div`
  position: relative;
  width: 280px;
  height: 280px;
  margin-bottom: 1.5rem;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
`;

const UploadSection = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem;
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
  width: 40px;
  height: 40px;
  margin: 0 auto 0.6rem;
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
    width: 20px;
    height: 20px;
  }
`;

const Title = styled.h1`
  font-size: 1.6rem;
  margin: 0;
  margin-bottom: 0.4rem;
  color: #8b4513;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  margin: 0;
  margin-bottom: 0.8rem;
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
  height: 8px;
  background: rgba(139, 69, 19, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.8rem;
  position: relative;
  border: 1px solid rgba(139, 69, 19, 0.2);

  &::after {
    content: "";
    display: block;
    width: ${(props) => props.$progress}%;
    height: 100%;
    background: linear-gradient(90deg, #8b4513, #a0522d);
    transition: width 0.4s ease;
    border-radius: 3px;
    box-shadow: 0 0 8px rgba(139, 69, 19, 0.3);
    position: relative;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shimmer 1.5s infinite;
    z-index: 1;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const ProgressText = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: #8b4513;
  margin-top: 0.4rem;
  font-weight: 500;
`;

const Footer = styled.footer`
  text-align: center;
  padding: 1rem 0;
  margin-top: 2rem;
  color: #8b4513;
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 1;
  border-top: 1px solid rgba(139, 69, 19, 0.3);
  width: 100%;
  max-width: 600px;
  line-height: 1.4;
  direction: ltr;
  unicode-bidi: bidi-override;
`;

const MessageInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  color: #8b4513;
  text-align: center;
  direction: rtl;

  &::placeholder {
    color: #a0522d;
    opacity: 0.7;
  }

  &:focus {
    outline: none;
    border-color: #8b4513;
    background: rgba(255, 255, 255, 0.9);
  }
`;

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState(0);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const { uploadFiles, isUploading, progress, error } = useUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setMessage(""); // Clear any previous message
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;

    try {
      await uploadFiles(selectedFiles, message);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFiles(null);
      setMessage(""); // Clear message after upload
      setKey((prev) => prev + 1);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleCancel = () => {
    setSelectedFiles(null);
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          {!selectedFiles ? (
            <UploadSection onClick={handleClick}>
              <FileInput
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
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
            </UploadSection>
          ) : (
            <UploadSection>
              <Title>קבצים נבחרו</Title>
              <Subtitle>{selectedFiles.length} קבצים מוכנים להעלאה</Subtitle>
              <MessageInput
                type="text"
                placeholder="שם או הודעה (אופציונלי)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isUploading}
              />
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "1rem",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  style={{
                    background: "#8b4513",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    opacity: isUploading ? 0.6 : 1,
                  }}
                >
                  {isUploading ? "מעלה..." : "העלה קבצים"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isUploading}
                  style={{
                    background: "transparent",
                    color: "#8b4513",
                    border: "1px solid #8b4513",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    opacity: isUploading ? 0.6 : 1,
                  }}
                >
                  ביטול
                </button>
              </div>
              {isUploading && (
                <>
                  <ProgressBar $progress={progress} />
                  <ProgressText>{Math.round(progress)}% הושלם</ProgressText>
                </>
              )}
              {error && (
                <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>
              )}
            </UploadSection>
          )}

          <GalleryPreview key={key} />
        </ContentWrapper>

        <Footer>© 2025 Karin Goldin. Designed and developed by me.</Footer>
      </Container>
    </div>
  );
}
