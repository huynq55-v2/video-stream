import { NextRequest, NextResponse } from 'next/server';
import { getLocalSubtitles, getDriveSubtitles } from '@/lib/subtitles';

/**
 * API endpoint to get available subtitles for a video
 * Query params:
 *   - id: video ID
 *   - type: 'local' or 'drive'
 *   - name: video name (for Drive videos)
 *   - googleApiKey: API key (for Drive videos)
 *   - googleDriveFolderId: folder ID (for Drive videos)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('id');
        const videoType = searchParams.get('type') || 'local';
        const videoName = searchParams.get('name') || videoId || '';
        const googleApiKey = searchParams.get('googleApiKey') || '';
        const googleDriveFolderId = searchParams.get('googleDriveFolderId') || '';

        if (!videoId) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        let subtitles: any[] = [];

        if (videoType === 'local') {
            subtitles = getLocalSubtitles(videoId);
        } else if (videoType === 'drive') {
            subtitles = await getDriveSubtitles(
                videoId,
                videoName,
                googleApiKey,
                googleDriveFolderId
            );
        }

        return NextResponse.json({ subtitles });
    } catch (error) {
        console.error('Error fetching subtitles:', error);
        return NextResponse.json({ error: 'Failed to fetch subtitles' }, { status: 500 });
    }
}
