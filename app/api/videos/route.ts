import { NextResponse } from 'next/server';
import { getLocalVideos } from '@/lib/local';
import { getDriveVideos } from '@/lib/drive';

export async function GET() {
    const localVideos = getLocalVideos().map(name => ({
        id: name,
        name: name,
        type: 'local'
    }));

    let driveVideos: any[] = [];
    try {
        const driveFiles = await getDriveVideos();
        driveVideos = driveFiles.map((file: any) => ({
            id: file.id,
            name: file.name,
            type: 'drive'
        }));
    } catch (error) {
        console.error('Failed to fetch drive videos', error);
    }

    return NextResponse.json({ videos: [...localVideos, ...driveVideos] });
}
