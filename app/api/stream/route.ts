import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getVideoPath, getVideoStat } from '@/lib/local';
import { getDriveVideoStream, getDriveClient } from '@/lib/drive';

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
                fields: 'size, mimeType',
            });

            const fileSize = parseInt(fileMetadata.data.size || '0');

            // Forward the range request to Google Drive
            // Note: Google Drive API handling of range headers is a bit complex via the node client
            // We will use axios or fetch manually if the client doesn't support it well, 
            // but let's try to proxy the stream.

            const headers: any = {
                'Content-Type': fileMetadata.data.mimeType || 'video/mp4',
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
                'Content-Type': 'video/mp4',
            };

            // @ts-expect-error: Next.js Response supports Node.js streams
            return new NextResponse(file, { status: 206, headers });
        } else {
            const headers = {
                'Content-Length': fileSize.toString(),
                'Content-Type': 'video/mp4',
            };
            const file = fs.createReadStream(getVideoPath(filename));
            // @ts-expect-error: Next.js Response supports Node.js streams
            return new NextResponse(file, { status: 200, headers });
        }
    }
}
