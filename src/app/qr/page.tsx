"use client";

import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";

const QRPageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 20px;
`;

const QRContainer = styled.div`
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const Title = styled.h1`
  color: #8b4513;
  text-align: center;
  font-size: 1.5rem;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #a0522d;
  text-align: center;
  font-size: 1rem;
  margin: 0;
`;

const PrintButton = styled.button`
  background: #8b4513;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #a0522d;
  }
`;

export default function QRPage() {
  const appUrl = "https://wedding-app-ten-phi.vercel.app/";

  const handlePrint = () => {
    window.print();
  };

  return (
    <QRPageWrapper>
      <QRContainer>
        <Title>סרקו והעלו תמונות וסרטונים מהחתונה</Title>
        <QRCodeSVG value={appUrl} size={300} level="H" includeMargin={true} />
        <Subtitle>או היכנסו לכתובת:</Subtitle>
        <Subtitle style={{ direction: "ltr" }}>{appUrl}</Subtitle>
      </QRContainer>
      <PrintButton onClick={handlePrint}>הדפסה</PrintButton>
    </QRPageWrapper>
  );
}
