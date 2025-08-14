import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { NextRequest } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = "wedding-photos";
const JWT_SECRET = process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase environment variables are not set.");
  throw new Error("Supabase environment variables are not set.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Middleware to check authentication
async function checkAuth(request: Request) {
  if (!JWT_SECRET) {
    console.error("Missing JWT_SECRET environment variable");
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    return false;
  }

  try {
    const decoded = verify(token.value, JWT_SECRET);
    return (
      decoded && typeof decoded === "object" && decoded.authenticated === true
    );
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Check authentication
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all files from storage
    const { data: files, error: filesError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list("", {
        sortBy: { column: "created_at", order: "desc" },
      });

    if (filesError) {
      console.error("Error loading files:", filesError);
      return NextResponse.json(
        { error: "Failed to load files" },
        { status: 500 }
      );
    }

    // Get all messages from database
    const { data: messages, error: messagesError } = await supabase
      .from("file_messages")
      .select("file_name, message");

    if (messagesError) {
      console.error("Error loading messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to load messages" },
        { status: 500 }
      );
    }

    // Create a map of file_name to message
    const messageMap = new Map();
    messages?.forEach((msg) => {
      messageMap.set(msg.file_name, msg.message);
    });

    // Process files and add messages
    const filesWithMessages = await Promise.all(
      files.map(async (file) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(file.name);

        const message = messageMap.get(file.name) || "אורח";
        const uploadTime = new Date(file.created_at || Date.now());

        return {
          fileName: file.name,
          originalName: file.name,
          displayName: `${message}_${file.name}`, // Name to display in export
          url: publicUrl,
          message: message,
          uploadTime: uploadTime.toISOString(),
          size: file.metadata?.size || 0,
        };
      })
    );

    return NextResponse.json({
      files: filesWithMessages,
      totalFiles: filesWithMessages.length,
      exportTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export files" },
      { status: 500 }
    );
  }
}
