import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Heart,
  Download,
  User,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { favoritesAPI } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritesMap, setFavoritesMap] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesAPI.getFavorites();
      setFavorites(response.data.gifs);

      // Create favorites map
      const map = {};
      response.data.gifs.forEach((gif) => {
        map[gif.id] = true;
      });
      setFavoritesMap(map);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (gifId) => {
    try {
      await favoritesAPI.toggle(gifId);

      // Remove from list
      setFavorites((prev) => prev.filter((gif) => gif.id !== gifId));
      setFavoritesMap((prev) => {
        const newMap = { ...prev };
        delete newMap[gifId];
        return newMap;
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // In the Favorites component, add delete handler
  const handleDeleteGif = async (gifId) => {
    if (window.confirm("Are you sure you want to delete this GIF?")) {
      try {
        await api.delete(`/gifs/${gifId}`);
        // Remove from favorites list
        setFavorites((prev) => prev.filter((gif) => gif.id !== gifId));
      } catch (error) {
        console.error("Error deleting GIF:", error);
        alert(error.response?.data?.error || "Failed to delete GIF");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition mb-2 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Heart size={32} className="fill-white" />
            <h1 className="text-3xl font-bold">My Favorites</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-4 text-gray-600 font-medium">
          {loading
            ? "Loading..."
            : `${favorites.length} favorited GIF${favorites.length !== 1 ? "s" : ""}`}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">
              Loading favorites...
            </p>
          </div>
        )}

        {/* GIF Grid - Masonry Layout */}
        {!loading && favorites.length > 0 && (
          <div className="masonry-grid">
            {favorites.map((gif) => (
              <div key={gif.id} className="masonry-item">
                <FavoriteGifCard
                  gif={gif}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && favorites.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <Heart size={64} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                No favorites yet
              </h2>
              <p className="text-gray-500 mb-6">
                Start favoriting GIFs you love!
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Browse GIFs
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FavoriteGifCard({ gif, onToggleFavorite, onDelete, currentUserId }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:3000";

  const storagePath = gif.storage_path?.replace(/^\//, "");
  const thumbnailPath = gif.thumbnail_path?.replace(/^\//, "");

  const gifUrl = `${API_BASE}/${storagePath}`;
  const thumbnailUrl = `${API_BASE}/${thumbnailPath}`;

  const handleClick = () => {
    navigate(`/gif/${gif.id}`);
  };

  const downloadGif = (e) => {
    e.stopPropagation(); // Prevent navigation when clicking download
    const link = document.createElement("a");
    link.href = gifUrl;
    link.download = gif.filename;
    link.click();
  };

  const copyLink = async (e) => {
    e.stopPropagation(); // Prevent navigation when clicking copy
    try {
      await navigator.clipboard.writeText(gifUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent navigation when clicking favorite
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      await onToggleFavorite(gif.id);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete(gif.id);
    }
  };

  const isOwner = currentUserId && gif.uploader_id === currentUserId;

  return (
    <div
      className="group relative bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* GIF Display Area */}
      <div className="relative overflow-hidden w-full bg-gray-200">
        {!imageError ? (
          <img
            src={isHovered ? gifUrl : thumbnailUrl}
            alt={gif.filename}
            className="w-full h-auto block"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <p className="text-sm">Failed to load GIF</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <div className="flex items-center justify-between text-white">
            <span className="flex items-center gap-1.5 font-medium text-sm">
              <User size={14} />
              <span className="truncate">{gif.uploader_username}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-sm">
              <Heart size={14} className="fill-red-400" />
              {gif.favorite_count}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          className="p-2.5 bg-red-500 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
          title="Unfavorite"
        >
          <Heart size={18} className="fill-white text-white" />
        </button>
        <button
          onClick={copyLink}
          className={`p-2.5 rounded-full shadow-lg hover:scale-110 transition-all duration-200 ${
            copied ? "bg-green-500" : "bg-white"
          }`}
          title={copied ? "Copied!" : "Copy Link"}
        >
          <LinkIcon
            size={18}
            className={copied ? "text-white" : "text-gray-700"}
          />
        </button>
        <button
          onClick={downloadGif}
          className="p-2.5 bg-white rounded-full shadow-lg hover:scale-110 transition-all duration-200"
          title="Download GIF"
        >
          <Download size={18} className="text-gray-700" />
        </button>

        {/* Delete button - only show if user owns the GIF */}
        {isOwner && (
          <button
            onClick={handleDelete}
            className="p-2.5 bg-red-600 rounded-full shadow-lg hover:scale-110 hover:bg-red-700 transition-all duration-200"
            title="Delete GIF"
          >
            <Trash2 size={18} className="text-white" />
          </button>
        )}
      </div>

      {/* Copied notification */}
      {copied && (
        <div className="absolute top-16 right-3 bg-green-500 text-white px-3 py-1 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          Link copied!
        </div>
      )}
    </div>
  );
}

export default Favorites;
