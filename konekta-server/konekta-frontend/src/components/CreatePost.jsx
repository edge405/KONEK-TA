import React, { useState } from 'react';
import { Image, Video, Link, Smile } from 'lucide-react';

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (content.trim()) {
            // Handle post creation
            console.log('Creating post:', content);
            setContent('');
            setIsExpanded(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 card-hover">
            <form onSubmit={handleSubmit}>
                <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        U
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsExpanded(true)}
                            placeholder="What's on your mind?"
                            className="w-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            rows={isExpanded ? 3 : 1}
                        />
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                type="button"
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Image className="w-5 h-5" />
                                <span className="text-sm">Photo</span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Video className="w-5 h-5" />
                                <span className="text-sm">Video</span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Link className="w-5 h-5" />
                                <span className="text-sm">Link</span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Smile className="w-5 h-5" />
                                <span className="text-sm">Feeling</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setContent('');
                                    setIsExpanded(false);
                                }}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!content.trim()}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Post
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default CreatePost;
