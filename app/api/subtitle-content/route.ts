import { NextRequest, NextResponse } from 'next/server';
import { readLocalSubtitle, readDriveSubtitle } from '@/lib/subtitles';

/**
 * API endpoint to get subtitle file content
 * Query params:
 *   - type: 'local' or 'drive'
 *   - filename: subtitle filename (for local)
 *   - fileId: subtitle file ID (for Drive)
 *   - fileName: subtitle file name (for Drive, needed for format detection)
 *   - googleApiKey: API key (for Drive)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'local';
        const filename = searchParams.get('filename') || '';
        const fileId = searchParams.get('fileId') || '';
        const fileName = searchParams.get('fileName') || '';
        const googleApiKey = searchParams.get('googleApiKey') || '';

        let content: string | null = null;

        if (type === 'local') {
            if (!filename) {
                return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
            }
            content = readLocalSubtitle(filename);
        } else if (type === 'drive') {
            if (!fileId || !fileName) {
                return NextResponse.json({ error: 'File ID and name are required' }, { status: 400 });
            }
            content = await readDriveSubtitle(fileId, fileName, googleApiKey);
        }

        if (!content) {
            return NextResponse.json({ error: 'Subtitle not found' }, { status: 404 });
        }

        // Return as WebVTT format
        return new NextResponse(content, {
            headers: {
                'Content-Type': 'text/vtt; charset=utf-8',
            },
        });
    } catch (error) {
        console.error('Error fetching subtitle content:', error);
        return NextResponse.json({ error: 'Failed to fetch subtitle content' }, { status: 500 });
    }
}
