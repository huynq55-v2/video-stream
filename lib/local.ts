import fs from 'fs';
import path from 'path';

const VIDEOS_DIR = path.join(process.cwd(), 'videos');

export function getLocalVideos() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    return [];
  }
  const files = fs.readdirSync(VIDEOS_DIR);
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp4', '.mkv', '.webm', '.mov'].includes(ext);
  });
}

export function getVideoPath(filename: string) {
  // Basic security check to prevent directory traversal
  const safeName = path.basename(filename);
  return path.join(VIDEOS_DIR, safeName);
}

export function getVideoStat(filename: string) {
  const filePath = getVideoPath(filename);
  if (fs.existsSync(filePath)) {
    return fs.statSync(filePath);
  }
  return null;
}
