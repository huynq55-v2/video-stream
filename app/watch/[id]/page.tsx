import VideoPlayer from '@/app/components/VideoPlayer';
import Link from 'next/link';

export default async function WatchPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ type?: string, name?: string }>
}) {
    const { id } = await params;
    const { type, name } = await searchParams;

    const videoId = decodeURIComponent(id);
    const videoType = type || 'local';
    const videoName = name ? decodeURIComponent(name) : videoId;

    return (
        <main className="min-h-screen bg-black text-white">
            <header className="p-4 border-b border-gray-800 flex items-center gap-4 sticky top-0 bg-black/90 backdrop-blur-sm z-10">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    ← Back
                </Link>
                <h1 className="text-xl font-bold text-red-600 tracking-tighter">Video Stream</h1>
            </header>
            <div className="p-6 flex justify-center">
                <VideoPlayer
                    videoId={videoId}
                    videoName={videoName}
                    videoType={videoType}
                />
            </div>
        </main>
    );
}
