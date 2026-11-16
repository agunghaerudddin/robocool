import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";
import sharp from "sharp";

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "before" | "after" | null;
    const location = (formData.get("location") as string | null) || "Lokasi tidak diketahui";
    const timestamp = (formData.get("timestamp") as string | null) || new Date().toLocaleString("id-ID");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Determine target folder based on type
    const folder = type === "after" ? "robocool/after" : "robocool/before";
    const labelType = type === "after" ? "FOTO SESUDAH" : "FOTO SEBELUM";

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Initial pass: Auto-rotate and normalize size
    const baseSharp = sharp(inputBuffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true });

    const metadata = await baseSharp.metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 800;

    // Overlay marquee watermark bar at the bottom
    const barHeight = Math.max(70, Math.round(height * 0.085));
    const fontSizeTitle = Math.max(14, Math.round(barHeight * 0.26));
    const fontSizeSub = Math.max(11, Math.round(barHeight * 0.2));

    const line1 = escapeXml(`${labelType} | ROBOCOOL`);
    const line2 = escapeXml(`WAKTU : ${timestamp}`);
    const line3 = escapeXml(`LOKASI: ${location}`);

    const svgWatermark = Buffer.from(`
      <svg width="${width}" height="${barHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.75" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.9" />
          </linearGradient>
        </defs>
        <!-- Background bar -->
        <rect width="${width}" height="${barHeight}" fill="url(#grad)" />
        <rect x="0" y="0" width="${width}" height="3" fill="#2563eb" />

        <!-- Text details -->
        <text x="20" y="${Math.round(barHeight * 0.32)}" font-family="Arial, sans-serif" font-size="${fontSizeTitle}" font-weight="bold" fill="#38bdf8">
          ${line1}
        </text>
        <text x="20" y="${Math.round(barHeight * 0.62)}" font-family="Arial, sans-serif" font-size="${fontSizeSub}" font-weight="500" fill="#f8fafc">
          ${line2}
        </text>
        <text x="20" y="${Math.round(barHeight * 0.88)}" font-family="Arial, sans-serif" font-size="${fontSizeSub}" font-weight="400" fill="#cbd5e1">
          ${line3}
        </text>
      </svg>
    `);

    // Composite the watermark bar onto the bottom and convert to WebP
    const webpBuffer = await baseSharp
      .composite([
        {
          input: svgWatermark,
          top: height - barHeight,
          left: 0,
        },
      ])
      .webp({ quality: 80 })
      .toBuffer();

    const base64Data = `data:image/webp;base64,${webpBuffer.toString("base64")}`;

    // Upload to Cloudinary with format: "webp"
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Data,
        {
          folder: folder,
          format: "webp",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result);
        }
      );
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      folder: uploadResult.folder,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });
  } catch (error: any) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
