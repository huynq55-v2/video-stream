import { NextRequest, NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/config';

export async function GET() {
    const config = getConfig();
    // Mask API Key for security when sending to frontend
    const maskedConfig = {
        ...config,
        googleApiKey: config.googleApiKey ? '********' : '',
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
