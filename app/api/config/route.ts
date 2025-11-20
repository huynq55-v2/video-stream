import { NextRequest, NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/config';

export async function GET() {
    const config = getConfig();

    // Merge with environment variables
    const effectiveConfig = {
        googleApiKey: config.googleApiKey || process.env.GOOGLE_API_KEY || '',
        googleDriveFolderId: config.googleDriveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    };

    // Mask API Key for security when sending to frontend
    const maskedConfig = {
        ...effectiveConfig,
        googleApiKey: effectiveConfig.googleApiKey ? '********' : '',
    };
    return NextResponse.json(maskedConfig);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const currentConfig = getConfig();

        const newConfig = {
            ...currentConfig,
            googleDriveFolderId: body.googleDriveFolderId,
        };

        // Only update API Key if provided (not empty string)
        if (body.googleApiKey && body.googleApiKey !== '********') {
            newConfig.googleApiKey = body.googleApiKey;
        }

        if (saveConfig(newConfig)) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Failed to save config' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }
}
