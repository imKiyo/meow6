import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Download,
  User,
  Clock,
  Eye,
  Link as LinkIcon,
  Tag,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api, { favoritesAPI } from "../services/api";

function GifDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gif, setGif] = useState(null);
  const [relatedGifs, setRelatedGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGifDetails();
    fetchRelatedGifs();
  }, [id]);

  const fetchGifDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/gifs/${id}`);
      setGif(response.data);

      // Check if favorited
      const favResponse = await favoritesAPI.checkFavorites([id]);
      setIsFavorited(!!favResponse.data.favorites[id]);
    } catch (error) {
      console.error("Error fetching GIF:", error);
      if (error.response?.status === 404) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedGifs = async () => {
    try {
      const response = await api.get(`/gifs/${id}/related`);
      setRelatedGifs(response.data.gifs);
    } catch (error) {
      console.error("Error fetching related GIFs:", error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const response = await favoritesAPI.toggle(id);
      setIsFavorited(response.data.isFavorited);
      setGif((prev) => ({
        ...prev,
        favorite_count: response.data.favoriteCount,
      }));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const downloadGif = () => {
    const API_BASE =
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
      "http://localhost:3000";
    const storagePath = gif.storage_path?.replace(/^\//, "");
    const gifUrl = `${API_BASE}/${storagePath}`;

    const link = document.createElement("a");
    link.href = gifUrl;
    link.download = gif.filename;
    link.click();
  };

  const copyLink = async () => {
    try {
      const API_BASE =
        import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "http://localhost:3000";
      const storagePath = gif.storage_path?.replace(/^\//, "");
      const gifUrl = `${API_BASE}/${storagePath}`;

      await navigator.clipboard.writeText(gifUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/gifs/${id}`);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error deleting GIF:", error);
      alert(error.response?.data?.error || "Failed to delete GIF");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  if (!gif) {
    return null;
  }

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:3000";
  const storagePath = gif.storage_path?.replace(/^\//, "");
  const gifUrl = `${API_BASE}/${storagePath}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:opacity-80 transition font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN - GIF Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img src={gifUrl} alt={gif.filename} className="w-full h-auto" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleToggleFavorite}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                  isFavorited
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <Heart size={20} className={isFavorited ? "fill-white" : ""} />
                {isFavorited ? "Unfavorite" : "Favorite"}
              </button>

              <button
                onClick={copyLink}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                <LinkIcon size={20} />
                {copied ? "Copied!" : "Copy Link"}
              </button>

              <button
                onClick={downloadGif}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <Download size={20} />
                Download
              </button>
            </div>

            {/* Delete button - only show if user owns the GIF */}
            {user && gif.uploader_id === user.userId && (
              <div className="mt-3">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  <Trash2 size={20} />
                  Delete GIF
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - GIF Info */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h1 className="text-2xl font-bold mb-4">GIF Details</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <Heart size={18} />
                    <span className="text-sm font-medium">Favorites</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {gif.favorite_count}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Eye size={18} />
                    <span className="text-sm font-medium">Views</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {gif.view_count}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <User size={18} />
                    <span className="text-sm font-medium">Uploader</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-700">
                    {gif.uploader_username}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock size={18} />
                    <span className="text-sm font-medium">Uploaded</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-700">
                    {formatDate(gif.uploaded_at)}
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="border-t pt-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  File Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-semibold">
                      {gif.width} × {gif.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Size:</span>
                    <span className="font-semibold">
                      {(gif.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Filename:</span>
                    <span className="font-semibold truncate max-w-xs">
                      {gif.filename}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={18} className="text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Tags
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gif.tags?.map((tag) => (
                    <Link
                      key={tag}
                      to={`/?tags=${tag}`}
                      className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-purple-200 transition"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related GIFs - OUTSIDE the grid, below everything */}
        {relatedGifs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related GIFs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {relatedGifs.map((relatedGif) => (
                <RelatedGifCard key={relatedGif.id} gif={relatedGif} />
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold">Delete GIF?</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this GIF? This action cannot be
                undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function RelatedGifCard({ gif }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:3000";
  const storagePath = gif.storage_path?.replace(/^\//, "");
  const thumbnailPath = gif.thumbnail_path?.replace(/^\//, "");
  const gifUrl = `${API_BASE}/${storagePath}`;
  const thumbnailUrl = `${API_BASE}/${thumbnailPath}`;

  return (
    <div
      onClick={() => navigate(`/gif/${gif.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden cursor-pointer"
    >
      <div className="aspect-video bg-gray-200 relative overflow-hidden">
        <img
          src={isHovered ? gifUrl : thumbnailUrl}
          alt={gif.filename}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <User size={12} />
              {gif.uploader_username}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={12} />
              {gif.favorite_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GifDetail;
