import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0;

// Fallback to the known project URL if env is missing
const FALLBACK_SUPABASE_URL = "https://udyuyhbqnbamixqcosqm.supabase.co";
const STORAGE_BUCKET = "wedding-photos";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return NextResponse.json(
        { error: "Missing server configuration", bytes: null, count: null },
        { status: 503 }
      );
    }

    // Admin client with service role key
    const supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Use the Storage API to list objects
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list("", {
        limit: 10000, // Adjust limit based on expected number of files
        offset: 0,
      });

    if (error) {
      console.error("Error listing storage objects:", error);
      return NextResponse.json(
        { error: "Failed to retrieve storage usage", bytes: null, count: null },
        { status: 500 }
      );
    }

    let totalBytes = 0;
    for (const row of data) {
      const sizeVal = row.metadata?.size;
      const sizeNum =
        typeof sizeVal === "string" ? parseInt(sizeVal, 10) : sizeVal ?? 0;
      totalBytes += Number.isFinite(sizeNum as number)
        ? (sizeNum as number)
        : 0;
    }

    return NextResponse.json({ bytes: totalBytes, count: data.length });
  } catch (err) {
    console.error("Unexpected error in storage usage API:", err);
    return NextResponse.json(
      { error: "Internal server error", bytes: null, count: null },
      { status: 500 }
    );
  }
}
