import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Upload as UploadIcon,
  X,
  ArrowLeft,
  Link as LinkIcon,
  Tag as TagIcon,
} from "lucide-react";
import { useAuth } from "../contexts/auth";
import api from "../services/api";

function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  useAuth();

  const handleFiles = (files) => {
    const gifFiles = Array.from(files).filter(
      (file) => file.type === "image/gif",
    );
    if (gifFiles.length !== files.length) {
      setError("Only GIF files are allowed");
      return;
    }
    const newEntries = gifFiles.map((file) => ({
      file,
      tags: [],
      currentInput: "",
      preview: URL.createObjectURL(file),
    }));
    setSelectedFiles((prev) => [...prev, ...newEntries]);
    setError("");
  };

  const handleFileSelect = (e) => handleFiles(e.target.files);
  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleUrlUpload = async () => {
    if (!urlInput) return;
    try {
      const res = await fetch(urlInput);
      const blob = await res.blob();
      if (blob.type !== "image/gif") throw new Error("Not a GIF");
      const file = new File([blob], "downloaded.gif", { type: "image/gif" });
      handleFiles([file]);
      setUrlInput("");
    } catch (err) {
      setError("Could not fetch GIF from URL.");
    }
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(selectedFiles[index].preview);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (index, e) => {
    const updated = [...selectedFiles];
    const item = updated[index];

    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const newTag = item.currentInput.trim();
      if (newTag && !item.tags.includes(newTag)) {
        item.tags.push(newTag);
      }
      item.currentInput = "";
    } else if (
      e.key === "Backspace" &&
      !item.currentInput &&
      item.tags.length > 0
    ) {
      item.tags.pop();
    }
    setSelectedFiles(updated);
  };

  const updateInput = (index, value) => {
    const updated = [...selectedFiles];
    updated[index].currentInput = value;
    setSelectedFiles(updated);
  };

  const removeTag = (fileIdx, tagIdx) => {
    const updated = [...selectedFiles];
    updated[fileIdx].tags.splice(tagIdx, 1);
    setSelectedFiles(updated);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selectedFiles.length === 0) {
      setError("Please select at least one GIF");
      return;
    }

    const finalizedFiles = selectedFiles.map((item) => {
      const finalTags = [...item.tags];
      const leftover = item.currentInput.trim();
      if (leftover && !finalTags.includes(leftover)) {
        finalTags.push(leftover);
      }
      return { ...item, tags: finalTags };
    });

    for (const item of finalizedFiles) {
      if (item.tags.length < 3) {
        setError(`"${item.file.name}" needs at least 3 tags.`);
        return;
      }
    }

    setUploading(true);

    try {
      for (const item of finalizedFiles) {
        const formData = new FormData();
        formData.append("gif", item.file);
        formData.append("tags", item.tags.join(", "));

        await api.post("/gifs/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccess(`Successfully uploaded ${finalizedFiles.length} GIFs!`);
      setSelectedFiles([]);
      setTimeout(() => navigate("/"), 2000);
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
            <ArrowLeft size={20} /> Back to Home
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
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
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
              <p className="text-lg mb-2 font-semibold text-gray-800 dark:text-gray-100">
                Drop GIFs or click to browse
              </p>
            </label>
            <div className="mt-4 flex max-w-sm mx-auto gap-2">
              <input
                type="text"
                placeholder="Paste link..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleUrlUpload}
                className="p-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 transition"
              >
                <LinkIcon size={18} />
              </button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-tight">
                Selected GIFs
              </h3>
              {selectedFiles.map((item, fileIdx) => (
                <div
                  key={fileIdx}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.preview}
                      alt="preview"
                      className="w-24 h-24 object-cover rounded-lg border dark:border-gray-700"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-sm font-bold truncate max-w-[200px]">
                          {item.file.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFile(fileIdx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 p-2 min-h-[42px] border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                        <TagIcon size={14} className="text-gray-400 ml-1" />
                        {item.tags.map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-semibold"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(fileIdx, tagIdx)}
                              className="hover:text-purple-200"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={item.currentInput}
                          placeholder={
                            item.tags.length === 0 ? "Add 3+ tags..." : ""
                          }
                          onChange={(e) => updateInput(fileIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(fileIdx, e)}
                          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
                          disabled={uploading}
                        />
                      </div>

                      {/* Restored Progress/Requirements Helper */}
                      <p
                        className={`mt-2 text-[10px] font-medium ${item.tags.length < 3 ? "text-gray-400" : "text-green-500"}`}
                      >
                        {item.tags.length < 3
                          ? `${3 - item.tags.length} more tag${3 - item.tags.length !== 1 ? "s" : ""} required`
                          : "Tag requirement met!"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
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
