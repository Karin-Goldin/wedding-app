"use client";

import styled from "styled-components";
import Image from "next/image";

const Overlay = styled.div`
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

const ModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;

  &:hover {
    background: white;
  }
`;

const MediaContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  }

  video {
    max-width: 90vw;
    max-height: 90vh;
  }
`;

interface MediaModalProps {
  url: string;
  isVideo: boolean;
  onClose: () => void;
}

export default function MediaModal({ url, isVideo, onClose }: MediaModalProps) {
  // Close on overlay click but not on content click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <MediaContainer>
          {isVideo ? (
            <video controls autoPlay>
              <source src={url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <Image
              src={url}
              alt="Wedding photo"
              width={1200}
              height={1200}
              style={{ objectFit: "contain" }}
            />
          )}
        </MediaContainer>
      </ModalContent>
    </Overlay>
  );
}
