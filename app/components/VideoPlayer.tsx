'use client';

import React from 'react';

interface VideoPlayerProps {
    videoId: string;
    videoName: string;
    videoType: string;
}

export default function VideoPlayer({ videoId, videoName, videoType }: VideoPlayerProps) {
    const videoSrc = `/api/stream?id=${encodeURIComponent(videoId)}&type=${videoType}`;

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <video
                    className="w-full h-full"
                    controls
                    autoPlay
                    src={videoSrc}
                >
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="mt-4 px-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">{videoName}</h1>
                <a
                    href={videoSrc}
                    download={videoName}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                >
                    ⬇️ Download
                </a>
            </div>
        </div>
    );
}
