import React, { useState, useEffect } from 'react';
import ebiroyUsernames from '../data/ebiroy_usernames.json';

export default function EbiroyFollowings() {
  const [currentIndex, setCurrentIndex] = useState(() => {
    return parseInt(localStorage.getItem('ebiroy_followings_index')) || 0;
  });

  const updateIndex = (index) => {
    setCurrentIndex(index);
    localStorage.setItem('ebiroy_followings_index', index);
  };

  const handleNext = () => {
    if (currentIndex < ebiroyUsernames.length) {
      const username = ebiroyUsernames[currentIndex];
      window.open(`https://instagram.com/${username}`, 'insta_window');
      updateIndex(currentIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 z-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Ebiroy Followings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Target list of {ebiroyUsernames.length} profiles to view.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="block text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Progress</span>
              <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{currentIndex} <span className="text-slate-400 text-lg font-medium">/ {ebiroyUsernames.length}</span></span>
            </div>
            <button 
              onClick={handleNext}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center space-x-3"
            >
              <span>Next Profile</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {ebiroyUsernames.map((username, index) => {
              const isCurrent = index === currentIndex - 1;
              const isPassed = index < currentIndex - 1;
              const isNext = index === currentIndex;
              
              return (
                <li 
                  key={`${username}-${index}`} 
                  className={`p-5 transition-all duration-200 
                    ${isCurrent ? 'bg-blue-50/80 dark:bg-blue-900/20' : ''} 
                    ${isPassed ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}
                    ${isNext ? 'bg-white dark:bg-slate-800 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex items-center space-x-6">
                    <span className={`font-mono text-sm w-12 text-right ${isCurrent ? 'text-blue-500 font-bold' : 'text-slate-400'}`}>
                      {index + 1}.
                    </span>
                    <a 
                      href={`https://instagram.com/${username}`}
                      target="insta_window"
                      className={`text-xl font-semibold hover:underline ${
                        isCurrent 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : isPassed 
                            ? 'text-slate-500 dark:text-slate-400 line-through' 
                            : 'text-slate-800 dark:text-slate-100'
                      }`}
                      onClick={() => updateIndex(index + 1)}
                    >
                      @{username}
                    </a>
                    
                    <div className="ml-auto flex items-center space-x-3">
                      {isPassed && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          Viewed
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold uppercase tracking-wider animate-pulse">
                          Current
                        </span>
                      )}
                      {isNext && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                          Next
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
