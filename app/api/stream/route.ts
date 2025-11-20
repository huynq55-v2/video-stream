import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getVideoPath, getVideoStat } from '@/lib/local';
import { getDriveClient } from '@/lib/drive';

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.ogv': 'video/ogg',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.m4v': 'video/x-m4v',
    };
    return mimeTypes[ext] || 'video/mp4';
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id) {
        return new NextResponse('Missing video id', { status: 400 });
    }

    if (type === 'drive') {
        try {
            const range = request.headers.get('range');
            const drive = await getDriveClient();

            // Get file size first
            const fileMetadata = await drive.files.get({
                fileId: id,
                fields: 'size, mimeType, name',
            });

            const fileSize = parseInt(fileMetadata.data.size || '0');
            const fileName = fileMetadata.data.name || '';
            const mimeType = fileMetadata.data.mimeType || getMimeType(fileName);

            // Forward the range request to Google Drive
            // Note: Google Drive API handling of range headers is a bit complex via the node client
            // We will use axios or fetch manually if the client doesn't support it well, 
            // but let's try to proxy the stream.

            const headers: any = {
                'Content-Type': mimeType,
            };

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;

                headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
                headers['Accept-Ranges'] = 'bytes';
                headers['Content-Length'] = chunksize.toString();

                const response = await drive.files.get(
                    { fileId: id, alt: 'media' },
                    { responseType: 'stream', headers: { Range: `bytes=${start}-${end}` } }
                );

                // @ts-expect-error: Next.js Response supports Node.js streams
                return new NextResponse(response.data, { status: 206, headers });
            } else {
                headers['Content-Length'] = fileSize.toString();
                const response = await drive.files.get(
                    { fileId: id, alt: 'media' },
                    { responseType: 'stream' }
                );
                // @ts-expect-error: Next.js Response supports Node.js streams
                return new NextResponse(response.data, { status: 200, headers });
            }

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
        const mimeType = getMimeType(filename);

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
