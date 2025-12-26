import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon, Monitor, Save } from "lucide-react";
import { useAuth } from "../contexts/auth";

function Settings() {
  const { user, theme, setTheme } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition font-medium"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-2">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          {/* Profile Info */}
          <div className="border-b dark:border-gray-700 pb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Profile
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Username
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.username}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Email
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="border-b dark:border-gray-700 pb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Appearance
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                    theme === "light"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <Sun size={18} />
                  Light
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                    theme === "system"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <Monitor size={18} />
                  System
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                    theme === "dark"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <Moon size={18} />
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Placeholders for future settings */}
          <div className="border-b dark:border-gray-700 pb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Content Filters
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Coming soon: NSFW filter, search behavior, and more.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Coming soon: Change password, delete account.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
