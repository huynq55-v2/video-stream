import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getVideoPath, getVideoStat } from '@/lib/local';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id) {
        return new NextResponse('Missing video id', { status: 400 });
    }

    if (type === 'drive') {
        try {
            const apiKey = searchParams.get('apiKey');

            if (!apiKey) {
                return new NextResponse('Missing API Key', { status: 400 });
            }

            // Direct streaming URL from Google Drive API
            const directUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${apiKey}`;

            // Redirect the client to fetch directly from Google
            return NextResponse.redirect(directUrl);

        } catch (error) {
            console.error('Drive stream error:', error);
            return new NextResponse('Error streaming from Drive', { status: 500 });
        }
    } else {
        // Local video handling
        const filename = id; // For local, id is the filename
        const stat = getVideoStat(filename);
        if (!stat) {
            return new NextResponse('Video not found', { status: 404 });
        }

        const fileSize = stat.size;
        const range = request.headers.get('range');

        // Determine MIME type based on extension
        const ext = filename.split('.').pop()?.toLowerCase();
        let mimeType = 'video/mp4';
        if (ext === 'mkv') mimeType = 'video/x-matroska';
        else if (ext === 'webm') mimeType = 'video/webm';
        else if (ext === 'mov') mimeType = 'video/quicktime';
        else if (ext === 'avi') mimeType = 'video/x-msvideo';

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(getVideoPath(filename), { start, end });

            const headers = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize.toString(),
                'Content-Type': mimeType,
            };

            // @ts-expect-error: Next.js Response supports Node.js streams
            return new NextResponse(file, { status: 206, headers });
        } else {
            const headers = {
                'Content-Length': fileSize.toString(),
                'Content-Type': mimeType,
            };
            const file = fs.createReadStream(getVideoPath(filename));
            // @ts-expect-error: Next.js Response supports Node.js streams
            return new NextResponse(file, { status: 200, headers });
        }
    }
}
