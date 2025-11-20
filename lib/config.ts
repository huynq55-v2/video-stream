import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export interface AppConfig {
    googleApiKey?: string;
    googleDriveFolderId?: string;
}

export function getConfig(): AppConfig {
    if (!fs.existsSync(CONFIG_PATH)) {
        return {};
    }
    try {
        const fileContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading config file:', error);
        return {};
    }
}

export function saveConfig(config: AppConfig) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing config file:', error);
        return false;
    }
}
