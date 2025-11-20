import { NextRequest, NextResponse } from 'next/server';
import { getLocalVideos } from '@/lib/local';
import { getDriveVideos } from '@/lib/drive';

export async function GET(request: NextRequest) {
    const localVideos = getLocalVideos().map(name => ({
        id: name,
        name: name,
        type: 'local'
    }));

    const apiKey = request.headers.get('x-google-api-key');
    const folderId = request.headers.get('x-google-drive-folder-id');

    let driveVideos: any[] = [];
    if (apiKey && folderId) {
        try {
            const driveFiles = await getDriveVideos(apiKey, folderId);
            driveVideos = driveFiles.map((file: any) => ({
                id: file.id,
                name: file.name,
                type: 'drive'
            }));
        } catch (error) {
            console.error('Failed to fetch drive videos', error);
        }
    }

    return NextResponse.json({ videos: [...localVideos, ...driveVideos] });
}
