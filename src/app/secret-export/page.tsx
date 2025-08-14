"use client";

import { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  color: #8b4513;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const PasswordForm = styled.div`
  text-align: center;
  margin: 2rem 0;
`;

const PasswordInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #8b4513;
  border-radius: 8px;
  font-size: 1rem;
  margin-right: 10px;
  width: 200px;
  text-align: center;

  &:focus {
    outline: none;
    border-color: #a0522d;
  }
`;

const SubmitButton = styled.button`
  background: #8b4513;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #a0522d;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const ExportButton = styled.button`
  background: #8b4513;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  margin: 1rem auto;
  display: block;
  transition: background 0.2s;

  &:hover {
    background: #a0522d;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Status = styled.div`
  text-align: center;
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 8px;
  background: #f0f8ff;
  color: #333;
`;

const FileList = styled.div`
  margin-top: 2rem;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
`;

const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;

  &:last-child {
    border-bottom: none;
  }
`;

const FileName = styled.span`
  font-weight: bold;
  color: #8b4513;
`;

const FileMessage = styled.span`
  color: #666;
  font-style: italic;
`;

interface FileInfo {
  fileName: string;
  displayName: string;
  url: string;
  message: string;
  uploadTime: string;
  size: number;
}

export default function SecretExportPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [status, setStatus] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Create a session-based authentication
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setError("סיסמה שגויה");
      }
    } catch (error: unknown) {
      console.error("Password verification error:", error);
      setError("שגיאה בבדיקת הסיסמה");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setStatus("מכין את הקבצים לייצוא...");

    try {
      // Get all files with messages
      const response = await fetch("/api/export");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to export");
      }

      setFiles(data.files);
      setStatus(`נמצאו ${data.totalFiles} קבצים לייצוא`);

      // Create a zip file with all photos
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Download each file and add to zip
      for (const file of data.files) {
        setStatus(`מוריד: ${file.message}_${file.fileName}`);

        const fileResponse = await fetch(file.url);
        const fileBlob = await fileResponse.blob();

        // Add file to zip with the message as prefix
        zip.file(`${file.message}_${file.fileName}`, fileBlob);
      }

      // Generate and download zip
      setStatus("יוצר קובץ ZIP...");
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wedding-photos-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStatus("הייצוא הושלם בהצלחה! הקובץ יורד אוטומטית.");
    } catch (error: unknown) {
      console.error("Export error:", error);
      setStatus(
        `שגיאה בייצוא: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <Title>ייצוא תמונות החתונה</Title>
        <p style={{ textAlign: "center", marginBottom: "2rem", color: "#666" }}>
          דף זה מוגן בסיסמה. הזן את הסיסמה כדי לגשת לייצוא התמונות.
        </p>

        <PasswordForm onSubmit={handlePasswordSubmit}>
          <PasswordInput
            type="password"
            placeholder="הזן סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handlePasswordSubmit(e);
              }
            }}
            required
          />
          <SubmitButton type="button" onClick={(e) => handlePasswordSubmit(e)}>
            כניסה
          </SubmitButton>
        </PasswordForm>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Container>
    );
  }

  return (
    <Container>
      <Title>ייצוא תמונות החתונה</Title>

      <p style={{ textAlign: "center", marginBottom: "2rem", color: "#666" }}>
        לחץ על הכפתור למטה כדי לייצא את כל התמונות עם השמות של המעלים
      </p>

      <ExportButton onClick={handleExport} disabled={isExporting}>
        {isExporting ? "מייצא..." : "ייצא את כל התמונות"}
      </ExportButton>

      {status && <Status>{status}</Status>}

      {files.length > 0 && (
        <FileList>
          <h3>רשימת קבצים לייצוא:</h3>
          {files.map((file, index) => (
            <FileItem key={index}>
              <FileName>{file.displayName}</FileName>
              <FileMessage>מאת: {file.message}</FileMessage>
            </FileItem>
          ))}
        </FileList>
      )}
    </Container>
  );
}
