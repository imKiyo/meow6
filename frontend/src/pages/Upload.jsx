import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload as UploadIcon, X, ArrowLeft, Tag } from "lucide-react";
import { useAuth } from "../contexts/auth";
import api from "../services/api";

function Upload() {
  // Store files as objects: { file: File, tags: "" }
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  useAuth();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const gifFiles = files.filter((file) => file.type === "image/gif");

    if (gifFiles.length !== files.length) {
      setError("Only GIF files are allowed");
      return;
    }

    // Map new files to the object structure
    const newFileObjects = gifFiles.map((file) => ({
      file,
      tags: "",
      id: Math.random().toString(36).substr(2, 9), // unique ID for keys
    }));

    setSelectedFiles((prev) => [...prev, ...newFileObjects]);
    setError("");
  };

  const updateFileTags = (index, value) => {
    setSelectedFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, tags: value } : item)),
    );
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateTags = (tagString) => {
    const tags = tagString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    return tags.length >= 3;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selectedFiles.length === 0) {
      setError("Please select at least one GIF");
      return;
    }

    // Validate that EVERY file has at least 3 tags
    const allValid = selectedFiles.every((item) => validateTags(item.tags));
    if (!allValid) {
      setError("All files must have at least 3 tags each.");
      return;
    }

    setUploading(true);

    try {
      for (const item of selectedFiles) {
        const formData = new FormData();
        formData.append("gif", item.file);
        formData.append("tags", item.tags);

        await api.post("/gifs/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setSuccess(`Successfully uploaded ${selectedFiles.length} GIFs!`);
      setSelectedFiles([]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Picker */}
          <div>
            <div className="border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer">
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
                <UploadIcon size={40} className="mx-auto mb-2 text-gray-400" />
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  Click to add GIFs
                </p>
              </label>
            </div>
          </div>

          {/* Individual File Editors */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Selected Files
              </h3>
              {selectedFiles.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={URL.createObjectURL(item.file)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Metadata & Input */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-sm truncate max-w-[200px]">
                          {item.file.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="relative">
                        <Tag
                          size={14}
                          className="absolute left-3 top-3 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Tags (min. 3, comma separated)"
                          value={item.tags}
                          onChange={(e) =>
                            updateFileTags(index, e.target.value)
                          }
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                          disabled={uploading}
                        />
                      </div>

                      {/* Visual Tag Feedback */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.split(",").map(
                          (tag, i) =>
                            tag.trim() && (
                              <span
                                key={i}
                                className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded"
                              >
                                #{tag.trim()}
                              </span>
                            ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition disabled:opacity-50"
          >
            {uploading
              ? "Processing..."
              : `Upload ${selectedFiles.length} GIF${selectedFiles.length !== 1 ? "s" : ""}`}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Upload;
