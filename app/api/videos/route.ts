import { NextRequest, NextResponse } from 'next/server';
import { getLocalVideos } from '@/lib/local';
import { getDriveVideos } from '@/lib/drive';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { googleApiKey, googleDriveFolderId } = body;

        const localVideos = getLocalVideos().map(name => ({
            id: name,
            name: name,
            type: 'local'
        }));

        let driveVideos: any[] = [];

        // Only fetch Drive videos if credentials are provided
        if (googleApiKey && googleDriveFolderId) {
            try {
                const driveFiles = await getDriveVideos(googleApiKey, googleDriveFolderId);
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
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ videos: [] });
    }
}
