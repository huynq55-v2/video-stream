'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Video {
    id: string;
    name: string;
    type: 'local' | 'drive';
}

export default function VideoList() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Read credentials from localStorage
        const googleApiKey = localStorage.getItem('googleApiKey') || '';
        const googleDriveFolderId = localStorage.getItem('googleDriveFolderId') || '';

        // Send credentials to API via POST
        fetch('/api/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                googleApiKey,
                googleDriveFolderId,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                setVideos(data.videos);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch videos', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-center p-10">Loading videos...</div>;
    }

    if (videos.length === 0) {
        return (
            <div className="text-center p-10">
                <p className="text-xl mb-4">No videos found.</p>
                <p className="text-gray-500">
                    Please add some video files to the <code>videos</code> folder or configure Google Drive.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            {videos.map((video) => (
                <Link
                    key={`${video.type}-${video.id}`}
                    href={`/watch/${encodeURIComponent(video.id)}?type=${video.type}&name=${encodeURIComponent(video.name)}`}
                    className="group block bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                >
                    <div className="aspect-video bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 relative">
                        <span className="text-4xl">▶️</span>
                        <span className="absolute top-2 right-2 text-xs bg-black/50 px-2 py-1 rounded uppercase">
                            {video.type}
                        </span>
                    </div>
                    <div className="p-4">
                        <h3 className="font-medium text-white truncate" title={video.name}>
                            {video.name}
                        </h3>
                    </div>
                </Link>
            ))}
        </div>
    );
}
