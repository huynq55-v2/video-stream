'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [folderId, setFolderId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                setApiKey(data.googleApiKey || '');
                setFolderId(data.googleDriveFolderId || '');
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load config', err);
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    googleApiKey: apiKey,
                    googleDriveFolderId: folderId,
                }),
            });

            if (res.ok) {
                setMessage('✅ Settings saved successfully!');
            } else {
                setMessage('⚠️ Could not save to file (Read-Only System?).\nIf you are on Vercel, please set Environment Variables in your Dashboard:\n- GOOGLE_API_KEY\n- GOOGLE_DRIVE_FOLDER_ID');
            }
        } catch (error) {
            setMessage('❌ Error saving settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-white">Loading settings...</div>;

    return (
        <main className="min-h-screen bg-black text-white">
            <header className="p-4 border-b border-gray-800 flex items-center gap-4 sticky top-0 bg-black/90 backdrop-blur-sm z-10">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    ← Back
                </Link>
                <h1 className="text-xl font-bold text-red-600 tracking-tighter">Settings</h1>
            </header>

            <div className="max-w-2xl mx-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-8 rounded-lg border border-gray-800">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Google API Key</label>
                        <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-red-600 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank to keep current key (if masked).</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Google Drive Folder ID</label>
                        <input
                            type="text"
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                            placeholder="1A2B3C..."
                            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-red-600 outline-none"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded whitespace-pre-wrap ${message.includes('✅') ? 'bg-green-900/50 text-green-200' : 'bg-yellow-900/50 text-yellow-200'}`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </main>
    );
}
