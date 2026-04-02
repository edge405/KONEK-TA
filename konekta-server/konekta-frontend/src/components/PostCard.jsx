import React from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';

const PostCard = ({ post }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 card-hover">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {post.author.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {post.author.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(post.created_at)}
                        </p>
                    </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className="text-gray-900 dark:text-white leading-relaxed">
                    {post.content}
                </p>
                {post.image && (
                    <div className="mt-4">
                        <img
                            src={post.image}
                            alt="Post content"
                            className="w-full rounded-lg object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-6">
                    <button
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${post.is_liked
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{post.likes_count}</span>
                    </button>

                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.comments_count}</span>
                    </button>

                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Share className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.shares_count}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
