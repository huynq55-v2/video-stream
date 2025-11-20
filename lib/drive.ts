import { google } from 'googleapis';
import { getConfig } from '@/lib/config';

export async function getDriveClient() {
    const config = getConfig();
    // Priority: Config file > Env var
    const apiKey = config.googleApiKey || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        throw new Error('Missing GOOGLE_API_KEY in config or env');
    }

    return google.drive({ version: 'v3', auth: apiKey });
}

export async function getDriveVideos() {
    const config = getConfig();
    const folderId = config.googleDriveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) return [];

    try {
        const drive = await getDriveClient();
        const response = await drive.files.list({
            q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
            fields: 'files(id, name, mimeType, size)',
            orderBy: 'name',
        });

        return response.data.files || [];
    } catch (error) {
        console.error('Error fetching Drive videos:', error);
        return [];
    }
}

export async function getDriveVideoStream(fileId: string, range?: string) {
    const drive = await getDriveClient();

    const headers: any = {
        alt: 'media',
    };

    if (range) {
        headers.Range = range;
    }

    return await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream', headers }
    );
}
