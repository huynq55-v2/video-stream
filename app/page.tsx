import VideoList from '@/app/components/VideoList';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="p-6 border-b border-gray-800 flex items-center sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold text-red-600 tracking-tighter">Video Stream</h1>
      </header>
      <VideoList />
    </main>
  );
}
