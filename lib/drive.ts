import { google } from 'googleapis';

export async function getDriveClient(apiKey: string) {
    if (!apiKey) {
        throw new Error('Missing GOOGLE_API_KEY');
    }

    return google.drive({ version: 'v3', auth: apiKey });
}

export async function getDriveVideos(apiKey: string, folderId: string) {
    if (!folderId || !apiKey) return [];

    try {
        const drive = await getDriveClient(apiKey);
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

export async function getDriveVideoStream(fileId: string, apiKey: string, range?: string) {
    const drive = await getDriveClient(apiKey);

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
