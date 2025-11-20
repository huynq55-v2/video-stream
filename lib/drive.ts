import { google } from 'googleapis';

export async function getDriveClient(apiKey?: string) {
    // Priority: Parameter > Env var
    const key = apiKey || process.env.GOOGLE_API_KEY;

    if (!key) {
        throw new Error('Missing GOOGLE_API_KEY');
    }

    return google.drive({ version: 'v3', auth: key });
}

export async function getDriveVideos(apiKey?: string, folderId?: string) {
    // Priority: Parameter > Env var
    const folderIdToUse = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderIdToUse) return [];

    try {
        const drive = await getDriveClient(apiKey);
        const response = await drive.files.list({
            q: `'${folderIdToUse}' in parents and mimeType contains 'video/' and trashed = false`,
            fields: 'files(id, name, mimeType, size)',
            orderBy: 'name',
        });

        return response.data.files || [];
    } catch (error) {
        console.error('Error fetching Drive videos:', error);
        return [];
    }
}

// export async function getDriveVideoStream(fileId: string, range?: string) {
//     const drive = await getDriveClient();

//     const headers: any = {
//         alt: 'media',
//     };

//     if (range) {
//         headers.Range = range;
//     }

//     return await drive.files.get(
//         { fileId, alt: 'media' },
//         { responseType: 'stream', headers }
//     );
// }
