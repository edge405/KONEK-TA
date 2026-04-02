import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCreatePost } from "../../hooks/usePosts";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { Image, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CreatePost() {
  const { user } = useAuth();
  const createPost = useCreatePost();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [active, setActive] = useState(false);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const resetForm = () => {
    setContent("");
    setImage(null);
    setImagePreview(null);
    setActive(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    try {
      await createPost.mutateAsync({
        content: content.trim(),
        image: image || undefined,
      });
      toast.success("Post created!");
      resetForm();
    } catch {
      toast.error("Failed to create post");
    }
  };

  const handleFocus = () => {
    setActive(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <Avatar
            src={user?.profile_picture}
            name={`${user?.first_name} ${user?.last_name}`}
            size="md"
          />
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleFocus}
              placeholder="What's on your mind?"
              rows={active ? 3 : 1}
              className="w-full resize-none border-none bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0"
            />

            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-800 text-white hover:bg-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {active && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                  >
                    <Image className="w-4 h-4" />
                    Photo
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!content.trim() && !image}
                    loading={createPost.isPending}
                  >
                    Post
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}
