import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Upload,
  User,
  LogOut,
  Heart,
  Download,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { favoritesAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

function Home() {
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [favorites, setFavorites] = useState({});
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchGifs();
  }, [searchQuery, selectedTags, sortBy]);

  // Check favorites when GIFs change
  useEffect(() => {
    if (gifs.length > 0) {
      checkFavorites();
    }
  }, [gifs]);

  const fetchGifs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);
      if (selectedTags.length > 0)
        params.append("tags", selectedTags.join(","));
      params.append("sortBy", sortBy);

      const response = await api.get(`/gifs?${params.toString()}`);
      setGifs(response.data.gifs);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorites = async () => {
    try {
      const gifIds = gifs.map((g) => g.id);
      const response = await favoritesAPI.checkFavorites(gifIds);
      setFavorites(response.data.favorites);
    } catch (error) {
      console.error("Error checking favorites:", error);
    }
  };

  const handleToggleFavorite = async (gifId) => {
    try {
      const response = await favoritesAPI.toggle(gifId);

      // Update local state
      setFavorites((prev) => ({
        ...prev,
        [gifId]: response.data.isFavorited,
      }));

      // Update favorite count in GIFs list
      setGifs((prev) =>
        prev.map((gif) =>
          gif.id === gifId
            ? { ...gif, favorite_count: response.data.favoriteCount }
            : gif,
        ),
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Get all unique tags from current GIFs
  const allTags = [...new Set(gifs.flatMap((gif) => gif.tags || []))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">🎬 GifStash</h1>
            <div className="flex gap-3 items-center">
              <Link
                to="/favorites"
                className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition font-semibold"
              >
                <Heart size={18} />
                <span className="hidden sm:inline">Favorites</span>
              </Link>
              <Link
                to="/upload"
                className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
              >
                <Upload size={18} />
                Upload
              </Link>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <User size={18} />
                <span className="hidden sm:inline">{user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by tags or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
              Quick Filters
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 20).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all shadow-md"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mb-4 text-gray-600 font-medium">
          {loading
            ? "Loading..."
            : `${gifs.length} GIF${gifs.length !== 1 ? "s" : ""} found`}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading GIFs...</p>
          </div>
        )}

        {/* GIF Grid */}
        {!loading && gifs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {gifs.map((gif) => (
              <GifCard
                key={gif.id}
                gif={gif}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && gifs.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <Search size={64} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                No GIFs found
              </h2>
              <p className="text-gray-500 mb-6">Be the first to upload!</p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                <Upload size={20} />
                Upload GIF
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function GifCard({ gif, favorites, onToggleFavorite }) {
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

  const isFavorited = favorites[gif.id] || false;

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

  return (
    <div
      className="group relative bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* GIF Display Area */}
      <div className="aspect-video bg-gray-200 relative overflow-hidden">
        {!imageError ? (
          <img
            src={isHovered ? gifUrl : thumbnailUrl}
            alt={gif.filename}
            className="w-full h-full object-cover"
            onError={() => {
              console.error(
                "Failed to load:",
                isHovered ? gifUrl : thumbnailUrl,
              );
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <p className="text-sm">Failed to load GIF</p>
          </div>
        )}

        {/* Hover Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Info Bar - Only on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <div className="flex items-center justify-between text-white">
            <span className="flex items-center gap-1.5 font-medium text-sm">
              <User size={14} />
              <span className="truncate">{gif.uploader_username}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-sm">
              <Heart size={14} className={isFavorited ? "fill-red-400" : ""} />
              {gif.favorite_count}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Only on hover */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          className={`p-2.5 rounded-full shadow-lg hover:scale-110 transition-all duration-200 ${
            isFavorited ? "bg-red-500" : "bg-white"
          }`}
          title={isFavorited ? "Unfavorite" : "Favorite"}
        >
          <Heart
            size={18}
            className={isFavorited ? "fill-white text-white" : "text-gray-700"}
          />
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

export default Home;
