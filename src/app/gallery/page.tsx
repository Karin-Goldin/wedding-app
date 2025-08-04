"use client";

import styled from "styled-components";
import Gallery from "@/components/Gallery";

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
  padding: 10px;
  border-radius: 16px;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
  margin-bottom: 10px;
`;

const BackButton = styled.button`
  background: rgba(139, 69, 19, 0.1);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  color: #8b4513;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  margin-bottom: 20px;

  &:hover {
    background: rgba(139, 69, 19, 0.2);
  }
`;

export default function GalleryPage() {
  return (
    <GalleryPageWrapper>
      <GalleryPageContainer>
        <Header id="gallery-header">
          <BackButton onClick={() => window.history.back()}>← חזרה</BackButton>
          <Title>הזכרונות שלנו איתכם</Title>
        </Header>
        <Gallery />
      </GalleryPageContainer>
    </GalleryPageWrapper>
  );
}
