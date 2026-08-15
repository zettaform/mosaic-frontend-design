import React, { useState, useRef, useEffect } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/20/solid';

function VolumeControl() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showSlider, setShowSlider] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const audioRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const audioClips = useRef([]);

  // Initialize audio element and create clips
  useEffect(() => {
    const initAudio = () => {
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.muted = isMuted;
        audioRef.current.loop = false; // Don't loop for clips
        
        // Create multiple audio clips if not already created
        if (audioClips.current.length === 0) {
          createMultipleAudioClips();
        }
      }
    };

    initAudio();
  }, []);

  // Create 10 different 2-second audio clips
  const createMultipleAudioClips = () => {
    const clips = [];
    const frequencies = [
      220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25
    ]; // Different musical notes
    
    for (let i = 0; i < 10; i++) {
      try {
        const sampleRate = 44100;
        const duration = 2; // 2 seconds
        const length = sampleRate * duration;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
          for (let j = 0; j < string.length; j++) {
            view.setUint8(offset + j, string.charCodeAt(j));
          }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Generate different tones for each clip
        let offset = 44;
        const frequency = frequencies[i];
        for (let j = 0; j < length; j++) {
          const time = j / sampleRate;
          // Create different patterns for each clip
          let sample = 0;
          if (i < 3) {
            // First 3 clips: simple sine waves
            sample = 0.1 * Math.sin(2 * Math.PI * frequency * time);
          } else if (i < 6) {
            // Next 3 clips: with harmonics
            sample = 0.08 * Math.sin(2 * Math.PI * frequency * time) + 
                     0.04 * Math.sin(2 * Math.PI * frequency * 2 * time);
          } else {
            // Last 4 clips: with modulation
            sample = 0.1 * Math.sin(2 * Math.PI * frequency * time) * 
                     Math.sin(2 * Math.PI * 5 * time);
          }
          
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
        
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        clips.push(URL.createObjectURL(blob));
      } catch (error) {
        console.log(`Error creating audio clip ${i}:`, error);
      }
    }
    
    audioClips.current = clips;
    console.log(`Created ${clips.length} audio clips`);
  };

  // Create background music
  const createBackgroundMusic = () => {
    try {
      const sampleRate = 44100;
      const duration = 4; // 4 seconds loop
      const length = sampleRate * duration;
      const arrayBuffer = new ArrayBuffer(44 + length * 2);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * 2, true);
      
      // Generate a pleasant ambient tone
      let offset = 44;
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const frequency = 220; // A3 note - lower and more pleasant
        const sample = 0.05 * Math.sin(2 * Math.PI * frequency * time) * Math.exp(-time * 0.2);
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
      }
    } catch (error) {
      console.log('Error creating background music:', error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Play random music clip
  const playRandomClip = () => {
    if (audioClips.current.length > 0 && !isMuted) {
      const randomIndex = Math.floor(Math.random() * audioClips.current.length);
      setCurrentClipIndex(randomIndex);
      
      if (audioRef.current) {
        audioRef.current.src = audioClips.current[randomIndex];
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
        console.log(`Playing clip ${randomIndex + 1} of ${audioClips.current.length}`);
      }
    }
  };

  // Play specific clip
  const playClip = (index) => {
    if (audioClips.current.length > 0 && !isMuted) {
      setCurrentClipIndex(index);
      
      if (audioRef.current) {
        audioRef.current.src = audioClips.current[index];
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
        console.log(`Playing clip ${index + 1} of ${audioClips.current.length}`);
      }
    }
  };

  // Expose functions globally
  useEffect(() => {
    window.playBackgroundMusic = playRandomClip;
    window.playSpecificClip = playClip;
    return () => {
      delete window.playBackgroundMusic;
      delete window.playSpecificClip;
    };
  }, [isMuted]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle hover with delay
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setShowSlider(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowSlider(false);
    }, 2000); // 2 second delay
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={toggleMute}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600/80 rounded-full transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <SpeakerXMarkIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <SpeakerWaveIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          )}
        </button>

        {/* Volume Slider - appears on hover when not muted */}
        {showSlider && !isMuted && (
          <div 
            className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-50"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 w-8">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Clip {currentClipIndex + 1}/10
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        preload="auto"
        loop
        style={{ display: 'none' }}
      />
    </>
  );
}

export default VolumeControl;
