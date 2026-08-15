import React, { useState, useRef } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { getApiUrl } from '../utils/getBackendUrl';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function OpenAITTS() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [model, setModel] = useState('tts-1');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [voices, setVoices] = useState([]);
  const audioRef = useRef(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Load available voices on component mount
  React.useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await fetch(getApiUrl('/tts/voices'));
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      showToast('Please enter some text to convert to speech', 'error');
      return;
    }

    if (text.length > 4096) {
      showToast('Text must be 4096 characters or less', 'error');
      return;
    }

    setLoading(true);
    setAudioUrl(null);
    setAudioBlob(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/tts/speech'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: voice,
          model: model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Get audio blob
      const blob = await response.blob();
      setAudioBlob(blob);
      
      // Create object URL for audio playback
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      showToast('Speech generated successfully!', 'success');
    } catch (error) {
      console.error('TTS error:', error);
      showToast(error.message || 'Failed to generate speech', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadAudio = () => {
    if (!audioBlob) {
      showToast('No audio to download', 'error');
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tts-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Audio downloaded successfully!', 'success');
  };

  const clearText = () => {
    setText('');
    setAudioUrl(null);
    setAudioBlob(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const characterCount = text.length;
  const maxCharacters = 4096;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="sidebar-shell-main">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                OpenAI TTS
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Convert text to speech using OpenAI's Text-to-Speech API
              </p>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input section */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Text Input
                </h2>

                {/* Text area */}
                <div className="mb-4">
                  <label
                    htmlFor="text-input"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Enter text to convert to speech
                  </label>
                  <textarea
                    id="text-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste your text here..."
                    rows={10}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <span
                      className={`text-xs ${
                        characterCount > maxCharacters
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {characterCount} / {maxCharacters} characters
                    </span>
                    {text && (
                      <button
                        onClick={clearText}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Voice selection */}
                <div className="mb-4">
                  <label
                    htmlFor="voice-select"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Voice
                  </label>
                  <select
                    id="voice-select"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {voices.length > 0 ? (
                      voices.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label} - {v.description}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="alloy">Alloy - Neutral, balanced voice</option>
                        <option value="echo">Echo - Clear, confident voice</option>
                        <option value="fable">Fable - Warm, expressive voice</option>
                        <option value="onyx">Onyx - Deep, authoritative voice</option>
                        <option value="nova">Nova - Bright, energetic voice</option>
                        <option value="shimmer">Shimmer - Soft, gentle voice</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Model selection */}
                <div className="mb-6">
                  <label
                    htmlFor="model-select"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Model
                  </label>
                  <select
                    id="model-select"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="tts-1">tts-1 (Standard, faster)</option>
                    <option value="tts-1-hd">tts-1-hd (High quality, slower)</option>
                  </select>
                </div>

                {/* Generate button */}
                <button
                  onClick={generateSpeech}
                  disabled={loading || !text.trim() || characterCount > maxCharacters}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Speech'
                  )}
                </button>
              </div>

              {/* Output section */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Audio Output
                </h2>

                {audioUrl ? (
                  <div className="space-y-4">
                    {/* Audio player */}
                    <div>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        controls
                        className="w-full"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={downloadAudio}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Audio
                    </button>

                    {/* Audio info */}
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p>Voice: <span className="font-medium capitalize">{voice}</span></p>
                      <p>Model: <span className="font-medium">{model}</span></p>
                      <p>Format: MP3</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Generated audio will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info section */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    About OpenAI TTS
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Maximum text length: 4,096 characters</li>
                      <li>Supported formats: MP3</li>
                      <li>Available voices: Alloy, Echo, Fable, Onyx, Nova, Shimmer</li>
                      <li>Models: tts-1 (standard) and tts-1-hd (high quality)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default OpenAITTS;
