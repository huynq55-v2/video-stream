'use client';

import React, { useEffect, useState, useRef } from 'react';

interface VideoPlayerProps {
    videoId: string;
    videoName: string;
    videoType: string;
}

interface Subtitle {
    id?: string;
    filename?: string;
    name?: string;
    language: string;
    label: string;
}

export default function VideoPlayer({ videoId, videoName, videoType }: VideoPlayerProps) {
    const videoSrc = `/api/stream?id=${encodeURIComponent(videoId)}&type=${videoType}`;
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [loading, setLoading] = useState(true);
    const [videoError, setVideoError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Fetch available subtitles
        const fetchSubtitles = async () => {
            try {
                // Get credentials from localStorage for Drive videos
                const googleApiKey = localStorage.getItem('googleApiKey') || '';
                const googleDriveFolderId = localStorage.getItem('googleDriveFolderId') || '';

                const params = new URLSearchParams({
                    id: videoId,
                    type: videoType,
                    name: videoName,
                });

                if (videoType === 'drive') {
                    params.append('googleApiKey', googleApiKey);
                    params.append('googleDriveFolderId', googleDriveFolderId);
                }

                const response = await fetch(`/api/subtitles?${params.toString()}`);
                const data = await response.json();

                if (data.subtitles && data.subtitles.length > 0) {
                    setSubtitles(data.subtitles);
                }
            } catch (error) {
                console.error('Error fetching subtitles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubtitles();
    }, [videoId, videoType, videoName]);

    // Handle video errors
    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const video = e.currentTarget;
        const error = video.error;

        if (error) {
            let errorMessage = 'Unable to play this video. ';

            // Check if it's a codec/format issue
            const fileExt = videoName.split('.').pop()?.toLowerCase();
            const isUnsupportedFormat = ['mkv', 'avi', 'wmv', 'flv'].includes(fileExt || '');
            const hasHEVC = videoName.toLowerCase().includes('x265') || videoName.toLowerCase().includes('hevc');
            const hasUnsupportedAudio = videoName.toLowerCase().includes('dd+') ||
                videoName.toLowerCase().includes('dd5') ||
                videoName.toLowerCase().includes('dts') ||
                videoName.toLowerCase().includes('truehd') ||
                videoName.toLowerCase().includes('ac3');

            if (isUnsupportedFormat || hasHEVC || hasUnsupportedAudio) {
                errorMessage = `This video uses unsupported format/codec: `;
                const issues = [];
                if (isUnsupportedFormat) issues.push(`${fileExt?.toUpperCase()} container`);
                if (hasHEVC) issues.push('x265/HEVC video');
                if (hasUnsupportedAudio) issues.push('DD+/DTS/AC3 audio');
                errorMessage += issues.join(', ') + '. ';
            }

            setVideoError(errorMessage);
        }
    };

    // Generate subtitle track URL
    const getSubtitleUrl = (subtitle: Subtitle): string => {
        const params = new URLSearchParams({ type: videoType });

        if (videoType === 'local' && subtitle.filename) {
            params.append('filename', subtitle.filename);
        } else if (videoType === 'drive') {
            const googleApiKey = localStorage.getItem('googleApiKey') || '';
            params.append('fileId', subtitle.id || '');
            params.append('fileName', subtitle.name || '');
            params.append('googleApiKey', googleApiKey);
        }

        return `/api/subtitle-content?${params.toString()}`;
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    autoPlay
                    src={videoSrc}
                    crossOrigin="anonymous"
                    onError={handleVideoError}
                >
                    {/* Add subtitle tracks */}
                    {subtitles.map((subtitle, index) => (
                        <track
                            key={index}
                            kind="subtitles"
                            src={getSubtitleUrl(subtitle)}
                            srcLang={subtitle.language}
                            label={subtitle.label}
                            default={index === 0}
                        />
                    ))}
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="mt-4 px-4">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold">{videoName}</h1>
                    <a
                        href={videoSrc}
                        download={videoName}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                        ⬇️ Download
                    </a>
                </div>

                {/* Error message */}
                {videoError && (
                    <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                                <h3 className="font-bold text-red-400 mb-2">Video Playback Error</h3>
                                <p className="text-sm text-gray-300 mb-3">{videoError}</p>
                                <div className="text-sm text-gray-400 space-y-3">
                                    <div>
                                        <p className="font-semibold text-gray-300 mb-2">💡 Recommended Solutions:</p>
                                        <ul className="list-disc list-inside space-y-2 ml-2">
                                            <li className="mb-2">
                                                <span className="font-medium text-gray-300">Quick Fix - Convert Audio Only:</span>
                                                <code className="block mt-1 ml-4 p-2 bg-black/50 rounded text-xs overflow-x-auto">
                                                    ffmpeg -i "{videoName}" -c:v copy -c:a aac -b:a 192k output.mp4
                                                </code>
                                                <span className="block mt-1 ml-4 text-xs text-gray-500">Fast conversion, keeps original video quality</span>
                                            </li>
                                            <li className="mb-2">
                                                <span className="font-medium text-gray-300">Full Conversion - Better Compatibility:</span>
                                                <code className="block mt-1 ml-4 p-2 bg-black/50 rounded text-xs overflow-x-auto">
                                                    ffmpeg -i "{videoName}" -c:v libx264 -crf 23 -c:a aac -b:a 192k output.mp4
                                                </code>
                                                <span className="block mt-1 ml-4 text-xs text-gray-500">Converts both video and audio, works on all browsers</span>
                                            </li>
                                            <li>Download and play with <strong>VLC Media Player</strong> (supports all codecs)</li>
                                        </ul>
                                    </div>
                                    <div className="pt-2 border-t border-gray-700">
                                        <p className="text-xs text-gray-500">
                                            <strong>Note:</strong> Web browsers only support MP4/WebM containers with H.264/VP9 video and AAC/Opus audio codecs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subtitle info */}
                {!loading && subtitles.length > 0 && (
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                        <span>📝</span>
                        <span>
                            {subtitles.length} subtitle{subtitles.length > 1 ? 's' : ''} available: {' '}
                            {subtitles.map(s => s.label).join(', ')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
