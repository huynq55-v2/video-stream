import fs from 'fs';
import path from 'path';
import { getDriveClient } from './drive';

const VIDEOS_DIR = path.join(process.cwd(), 'videos');

/**
 * Parse subtitle filename to extract language code
 * Examples:
 *   movie.en.srt -> en
 *   movie.vi.srt -> vi
 *   movie.srt -> default
 */
export function parseSubtitleLanguage(filename: string): { language: string; label: string } {
    const parts = filename.split('.');

    // Check if there's a language code before the extension
    if (parts.length >= 3) {
        const langCode = parts[parts.length - 2];

        // Common language codes
        const languages: Record<string, string> = {
            'en': 'English',
            'vi': 'Tiếng Việt',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'ja': '日本語',
            'ko': '한국어',
            'zh': '中文',
            'ru': 'Русский',
        };

        if (languages[langCode]) {
            return { language: langCode, label: languages[langCode] };
        }
    }

    return { language: 'default', label: 'Default' };
}

/**
 * Convert SRT format to VTT format
 * HTML5 video requires WebVTT format
 */
export function convertSrtToVtt(srtContent: string): string {
    // Add WEBVTT header
    let vttContent = 'WEBVTT\n\n';

    // Replace comma with dot in timestamps (SRT uses comma, VTT uses dot)
    vttContent += srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

    return vttContent;
}

/**
 * Get local subtitle files for a video
 */
export function getLocalSubtitles(videoId: string): Array<{ filename: string; language: string; label: string }> {
    try {
        if (!fs.existsSync(VIDEOS_DIR)) {
            return [];
        }

        const files = fs.readdirSync(VIDEOS_DIR);
        const videoBaseName = path.parse(videoId).name;

        const subtitles = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                const baseName = file.substring(0, file.lastIndexOf('.'));

                // Check if it's a subtitle file for this video
                return (ext === '.srt' || ext === '.vtt') && baseName.startsWith(videoBaseName);
            })
            .map(file => {
                const { language, label } = parseSubtitleLanguage(file);
                return { filename: file, language, label };
            });

        return subtitles;
    } catch (error) {
        console.error('Error getting local subtitles:', error);
        return [];
    }
}

/**
 * Get Google Drive subtitle files for a video
 */
export async function getDriveSubtitles(
    videoId: string,
    videoName: string,
    apiKey?: string,
    folderId?: string
): Promise<Array<{ id: string; name: string; language: string; label: string }>> {
    try {
        if (!apiKey || !folderId) {
            return [];
        }

        const drive = await getDriveClient(apiKey);
        const videoBaseName = path.parse(videoName).name;

        // Search for subtitle files with similar names
        const response = await drive.files.list({
            q: `'${folderId}' in parents and (name contains '${videoBaseName}.srt' or name contains '${videoBaseName}.vtt') and trashed = false`,
            fields: 'files(id, name)',
        });

        const files = response.data.files || [];

        return files.map(file => {
            const { language, label } = parseSubtitleLanguage(file.name || '');
            return {
                id: file.id || '',
                name: file.name || '',
                language,
                label,
            };
        });
    } catch (error) {
        console.error('Error getting Drive subtitles:', error);
        return [];
    }
}

/**
 * Read local subtitle file content
 */
export function readLocalSubtitle(filename: string): string | null {
    try {
        const filePath = path.join(VIDEOS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const ext = path.extname(filename).toLowerCase();

        // Convert SRT to VTT if needed
        if (ext === '.srt') {
            return convertSrtToVtt(content);
        }

        return content;
    } catch (error) {
        console.error('Error reading local subtitle:', error);
        return null;
    }
}

/**
 * Read Google Drive subtitle file content
 */
export async function readDriveSubtitle(fileId: string, fileName: string, apiKey?: string): Promise<string | null> {
    try {
        if (!apiKey) {
            return null;
        }

        const drive = await getDriveClient(apiKey);
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'text' }
        );

        const content = response.data as string;
        const ext = path.extname(fileName).toLowerCase();

        // Convert SRT to VTT if needed
        if (ext === '.srt') {
            return convertSrtToVtt(content);
        }

        return content;
    } catch (error) {
        console.error('Error reading Drive subtitle:', error);
        return null;
    }
}
