import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Play,
  Pause,
  Loader2,
  Sparkles,
  Volume2,
  X,
  Settings,
  Download,
  FileText,
  History,
  Trash2,
} from "lucide-react";
import axios from "axios";

function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [style, setStyle] = useState("Creative");
  const [voice, setVoice] = useState("Aoede");
  const [language, setLanguage] = useState("English");
  const [customPrompt, setCustomPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/history");
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const saveToHistory = (newResult, usedStyle, usedVoice, usedLanguage) => {
    // The backend now handles saving, so we just need to refresh the list
    // or optimistically add the item returned by the backend
    if (newResult.history_item) {
      setHistory((prev) => [newResult.history_item, ...prev]);
    } else {
      fetchHistory();
    }
  };

  const deleteHistoryItem = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://127.0.0.1:8000/api/history/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting history item:", error);
      alert("Failed to delete history item.");
    }
  };

  const loadFromHistory = (item) => {
    // Use the audio_url from the history item if available, otherwise fallback (though backend should provide it)
    setResult({
      story: item.story,
      audio: item.audio_url || item.audio,
    });
    setStyle(item.style);
    setVoice(item.voice);
    setLanguage(item.language || "English");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);

      const newPreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviews((prev) => [...prev, ...newPreviews]);

      setResult(null);
    }
  };

  const removeImage = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (files.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("style", style);
    formData.append("voice", voice);
    formData.append("language", language);
    if (customPrompt) {
      formData.append("custom_prompt", customPrompt);
    }

    try {
      // Direct connection to backend, bypassing Vite proxy to avoid ECONNREFUSED issues
      const response = await axios.post(
        "http://127.0.0.1:8000/api/generate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data);
      saveToHistory(response.data, style, voice, language);
    } catch (error) {
      console.error("Error generating story:", error);
      if (error.response && error.response.status === 429) {
        alert(error.response.data.detail);
      } else {
        alert("Failed to generate story. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadAudio = () => {
    if (!result?.audio) return;
    const link = document.createElement("a");
    link.href = result.audio;
    link.download = `story-audio-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadStory = () => {
    if (!result?.story) return;
    const blob = new Blob([result.story], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `story-text-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-200/60">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              StoryGen
            </h1>
          </div>
          <p className="text-slate-500 text-lg font-medium">
            Transform your memories into magical stories.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Controls */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/20 space-y-5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                <Settings className="w-5 h-5 text-slate-400" />
                <span>Configuration</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                      Style
                    </label>
                    <div className="relative">
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none font-medium"
                      >
                        <option value="Creative">Creative</option>
                        <option value="Fairy Tale">Fairy Tale</option>
                        <option value="Horror">Horror</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Mystery">Mystery</option>
                        <option value="Comedy">Comedy</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                      Voice
                    </label>
                    <div className="relative">
                      <select
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none font-medium"
                      >
                        <option value="Aoede">Aoede</option>
                        <option value="Charon">Charon</option>
                        <option value="Fenrir">Fenrir</option>
                        <option value="Kore">Kore</option>
                        <option value="Puck">Puck</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none font-medium"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Portuguese">Portuguese</option>
                  </select>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                    Custom Instructions
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Add specific details..."
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-20 resize-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div
              className={`relative group border-2 border-dashed rounded-3xl p-8 transition-all duration-300 ease-out ${
                previews.length > 0
                  ? "border-blue-500/30 bg-blue-50/30"
                  : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
              />

              {previews.length === 0 ? (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center cursor-pointer py-8"
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Upload className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-lg font-semibold text-slate-700">
                    Upload Photos
                  </span>
                  <span className="text-sm text-slate-400 mt-1">
                    Drag & drop or click to browse
                  </span>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {previews.map((src, index) => (
                      <div
                        key={index}
                        className="relative group/img aspect-square"
                      >
                        <img
                          src={src}
                          alt={`Preview ${index}`}
                          className="w-full h-full object-cover rounded-2xl shadow-sm border border-slate-100"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-all shadow-sm hover:bg-red-50 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group/add"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-2 group-hover/add:bg-blue-50 group-hover/add:text-blue-500 transition-colors">
                        <Upload className="w-4 h-4 text-slate-400 group-hover/add:text-blue-500" />
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        Add more
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {files.length > 0 && !result && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    <span className="text-slate-200">Crafting Story...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    Generate Story
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7 space-y-6">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 min-h-[400px] bg-white/50 rounded-3xl border border-slate-100">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="font-medium animate-pulse text-slate-500">
                  Weaving your story...
                </p>
              </div>
            )}

            {result && (
              <div className="animate-fade-in space-y-6">
                {/* Audio Player Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
                  <button
                    onClick={toggleAudio}
                    className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 shrink-0 group"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white fill-current" />
                    ) : (
                      <Play className="w-6 h-6 text-white fill-current ml-1 group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        Audio Narration
                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {voice}
                        </span>
                      </h3>
                      <button
                        onClick={downloadAudio}
                        className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                        title="Download Audio"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-slate-900 w-full origin-left ${
                          isPlaying ? "animate-pulse" : ""
                        }`}
                      ></div>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={result.audio}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>

                {/* Story Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20"></div>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 font-serif tracking-tight">
                      The Story
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadStory}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                        title="Download Text"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center uppercase tracking-wide">
                        {style}
                      </span>
                    </div>
                  </div>
                  <div className="prose prose-slate prose-lg max-w-none">
                    <p className="leading-relaxed text-slate-600 font-serif">
                      {result.story}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {files.length === 0 && !loading && !result && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-3xl border border-slate-200/60 min-h-[400px]">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-500">
                  Ready to create magic
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Library</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="bg-white border border-slate-100 rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {item.date}
                    </span>
                    <button
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-6 font-serif leading-relaxed">
                    {item.preview}
                  </p>
                  <div className="flex gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    <span className="px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                      {item.style}
                    </span>
                    <span className="px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                      {item.voice}
                    </span>
                    {item.language && (
                      <span className="px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                        {item.language}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
