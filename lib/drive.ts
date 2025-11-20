import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export async function getDriveClient() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('Missing Google Drive credentials');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: SCOPES,
    });

    return google.drive({ version: 'v3', auth });
}

export async function getDriveVideos() {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) return [];

    try {
        const drive = await getDriveClient();
        const response = await drive.files.list({
            q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
            fields: 'files(id, name, mimeType, size, webContentLink)',
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
