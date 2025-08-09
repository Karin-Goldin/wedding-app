"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

const MonitorContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
  z-index: 1000;
  min-width: 220px;
`;

const Metric = styled.div`
  margin: 4px 0;
  display: flex;
  justify-content: space-between;
`;

interface PerformanceMetrics {
  uploadCount: number;
  lastUploadTime: number;
  averageUploadTime: number;
  errors: number;
  activeConnections: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    uploadCount: 0,
    lastUploadTime: 0,
    averageUploadTime: 0,
    errors: 0,
    activeConnections: 1, // Start with 1 for the current user
  });

  const [isVisible, setIsVisible] = useState(false);
  const [storageBytes, setStorageBytes] = useState<number | null>(null);
  const [storageCount, setStorageCount] = useState<number | null>(null);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const showMonitor =
      process.env.NODE_ENV === "development" ||
      localStorage.getItem("showPerformanceMonitor") === "true";
    setIsVisible(showMonitor);

    if (!showMonitor) return;

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

    // Poll storage usage every 30s
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
    const timer = setInterval(fetchUsage, 30000);

    return () => {
      window.removeEventListener("upload-success", handleUpload);
      window.removeEventListener("upload-error", handleError);
      clearInterval(timer);
    };
  }, []);

  if (!isVisible) return null;

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return "N/A";
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatGB = (bytes: number | null) => {
    if (bytes == null) return "N/A";
    return (bytes / 1024 ** 3).toFixed(2) + " GB";
  };

  return (
    <MonitorContainer>
      <Metric>
        <span>Uploads:</span>
        <span>{metrics.uploadCount}</span>
      </Metric>
      <Metric>
        <span>Last Upload:</span>
        <span>{formatTime(metrics.lastUploadTime)}</span>
      </Metric>
      <Metric>
        <span>Errors:</span>
        <span>{metrics.errors}</span>
      </Metric>
      <Metric>
        <span>Active Users:</span>
        <span>{metrics.activeConnections}</span>
      </Metric>
      <Metric>
        <span>Storage Used:</span>
        <span>{formatGB(storageBytes)}</span>
      </Metric>
      <Metric>
        <span>Files:</span>
        <span>{storageCount ?? "N/A"}</span>
      </Metric>
    </MonitorContainer>
  );
}
