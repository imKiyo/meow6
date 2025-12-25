import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload as UploadIcon, X, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const gifFiles = files.filter((file) => file.type === "image/gif");

    if (gifFiles.length !== files.length) {
      setError("Only GIF files are allowed");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...gifFiles]);
    setError("");
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selectedFiles.length === 0) {
      setError("Please select at least one GIF");
      return;
    }

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (tagArray.length < 3) {
      setError("Please add at least 3 tags (comma-separated)");
      return;
    }

    setUploading(true);

    try {
      // Upload each file
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("gif", file);
        formData.append("tags", tags);

        await api.post("/gifs/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setSuccess(
        `Successfully uploaded ${selectedFiles.length} GIF${selectedFiles.length > 1 ? "s" : ""}!`,
      );
      setSelectedFiles([]);
      setTags("");

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition mb-2 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Upload GIFs</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select GIF Files
            </label>
            <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center bg-white hover:bg-gray-50 transition cursor-pointer">
              <input
                type="file"
                accept="image/gif"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
                disabled={uploading}
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <UploadIcon size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2 font-semibold">
                  Drop GIFs here or click to browse
                </p>
                <p className="text-sm text-gray-500">Maximum 20MB per file</p>
              </label>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="max-w-full max-h-full"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                      disabled={uploading}
                    >
                      <X size={20} className="text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags (comma-separated, minimum 3 required)
            </label>
            <input
              type="text"
              placeholder="e.g., cat, funny, dancing, reaction"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Add at least 3 descriptive tags to help others find your GIFs
            </p>
            {tags && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.split(",").map((tag, i) => {
                  const trimmedTag = tag.trim();
                  return trimmedTag ? (
                    <span
                      key={i}
                      className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm"
                    >
                      {trimmedTag}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Upload Guidelines */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Upload Guidelines
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Maximum file size: 20 MB per GIF</li>
              <li>• Only .gif files are accepted</li>
              <li>• Original quality will be preserved</li>
              <li>• Add descriptive tags for better discoverability</li>
              <li>• At least 3 tags are required</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Uploading..."
              : `Upload ${selectedFiles.length} GIF${selectedFiles.length !== 1 ? "s" : ""}`}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Upload;
