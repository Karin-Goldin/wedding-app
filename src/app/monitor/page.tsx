"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";

const MonitorPageWrapper = styled.div`
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

const MonitorContainer = styled.div`
  padding: 40px 20px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  color: #8b4513;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.8;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #8b4513;
  margin-bottom: 8px;
`;

const MetricLabel = styled.div`
  font-size: 1rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
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

const StatusIndicator = styled.div<{ $status: "good" | "warning" | "error" }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 auto 8px;
  background: ${(props) => {
    switch (props.$status) {
      case "good":
        return "#27ae60";
      case "warning":
        return "#f39c12";
      case "error":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  }};
`;

interface PerformanceMetrics {
  uploadCount: number;
  lastUploadTime: number;
  averageUploadTime: number;
  errors: number;
  activeConnections: number;
}

export default function MonitorPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    uploadCount: 0,
    lastUploadTime: 0,
    averageUploadTime: 0,
    errors: 0,
    activeConnections: 1,
  });

  const [storageBytes, setStorageBytes] = useState<number | null>(null);
  const [storageCount, setStorageCount] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Track upload events
    const handleUpload = () => {
      setMetrics((prev) => ({
        ...prev,
        uploadCount: prev.uploadCount + 1,
        lastUploadTime: Date.now(),
      }));
    };

    // Track errors
    const handleError = () => {
      setMetrics((prev) => ({
        ...prev,
        errors: prev.errors + 1,
      }));
    };

    // Listen for custom events
    window.addEventListener("upload-success", handleUpload);
    window.addEventListener("upload-error", handleError);

    // Poll storage usage
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/storage-usage");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.bytes === "number") setStorageBytes(data.bytes);
        if (typeof data.count === "number") setStorageCount(data.count);
      } catch {
        // ignore
      }
    };

    fetchUsage();
    const t = setInterval(fetchUsage, 30000);

    return () => {
      window.removeEventListener("upload-success", handleUpload);
      window.removeEventListener("upload-error", handleError);
      clearInterval(t);
    };
  }, []);

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return "N/A";
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatStorage = (bytes: number | null) => {
    if (bytes == null) return "N/A";
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return size.toFixed(unitIndex === 0 ? 0 : 1) + " " + units[unitIndex];
  };

  const getStatus = (metric: keyof PerformanceMetrics) => {
    switch (metric) {
      case "errors":
        return metrics.errors === 0
          ? "good"
          : metrics.errors < 5
          ? "warning"
          : "error";
      case "uploadCount":
        return metrics.uploadCount > 0 ? "good" : "warning";
      default:
        return "good";
    }
  };

  return (
    <MonitorPageWrapper>
      <MonitorContainer>
        <Header>
          <BackButton onClick={() => router.push("/")}>← חזרה</BackButton>
          <Title>מעקב ביצועים</Title>
          <Subtitle>Performance Monitor</Subtitle>
        </Header>

        <MetricsGrid>
          <MetricCard>
            <StatusIndicator $status={getStatus("uploadCount")} />
            <MetricValue>{metrics.uploadCount}</MetricValue>
            <MetricLabel>העלאות</MetricLabel>
          </MetricCard>

          <MetricCard>
            <StatusIndicator $status="good" />
            <MetricValue>{formatTime(metrics.lastUploadTime)}</MetricValue>
            <MetricLabel>העלאה אחרונה</MetricLabel>
          </MetricCard>

          <MetricCard>
            <StatusIndicator $status={getStatus("errors")} />
            <MetricValue>{metrics.errors}</MetricValue>
            <MetricLabel>שגיאות</MetricLabel>
          </MetricCard>

          <MetricCard>
            <StatusIndicator $status="good" />
            <MetricValue>{metrics.activeConnections}</MetricValue>
            <MetricLabel>משתמשים פעילים</MetricLabel>
          </MetricCard>

          <MetricCard>
            <StatusIndicator $status="good" />
            <MetricValue>{formatStorage(storageBytes)}</MetricValue>
            <MetricLabel>נפח מאוחסן</MetricLabel>
          </MetricCard>

          <MetricCard>
            <StatusIndicator $status="good" />
            <MetricValue>{storageCount ?? "N/A"}</MetricValue>
            <MetricLabel>מספר קבצים</MetricLabel>
          </MetricCard>
        </MetricsGrid>

        <div style={{ textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
          <p>🔒 Secret monitoring page - Only accessible via direct URL</p>
          <p>Path: /monitor</p>
        </div>
      </MonitorContainer>
    </MonitorPageWrapper>
  );
}
