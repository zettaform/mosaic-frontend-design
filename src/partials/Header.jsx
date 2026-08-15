import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import SearchModal from '../components/ModalSearch';
import Notifications from '../components/DropdownNotifications';
import Help from '../components/DropdownHelp';
import UserMenu from '../components/DropdownProfile';
import ThemeToggle from '../components/ThemeToggle.tsx';
import VolumeControl from '../components/VolumeControl';
import TextSizeAdjuster from '../components/TextSizeAdjuster';
function Header({
  sidebarOpen,
  setSidebarOpen
}) {

  const [searchModalOpen, setSearchModalOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-md backdrop-saturate-150 dark:border-slate-700 dark:bg-[#182235] dark:shadow-none dark:backdrop-blur-none">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 min-h-[4rem]">

          {/* Header: Left side */}
          <div className="flex items-center gap-4">

            {/* Hamburger button */}
            <button
              className="lg:hidden rounded-lg p-2 -ml-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:ml-0 dark:rounded-none dark:p-0 dark:text-slate-500 dark:hover:bg-transparent dark:hover:text-slate-400"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>

          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            <div>
              <button
                className={`w-9 h-9 flex items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-transparent dark:bg-slate-700 dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-600/80 ml-3 ${searchModalOpen ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-transparent dark:bg-slate-600 dark:text-slate-100' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSearchModalOpen(true); }}
                aria-controls="search-modal"
              >
                <span className="sr-only">Search</span>
                <svg className="w-4 h-4" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                  <path className="fill-current text-slate-500 dark:text-slate-400" d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
                  <path className="fill-current text-slate-400 dark:text-slate-500" d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
                </svg>
              </button>
              <SearchModal id="search-modal" searchId="search" modalOpen={searchModalOpen} setModalOpen={setSearchModalOpen} />
            </div>
            <Notifications align="right" />
            <Help align="right" />
            <VolumeControl />
            <TextSizeAdjuster />
            <button
              onClick={() => {
                if (window.playBackgroundMusic) {
                  window.playBackgroundMusic();
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-transparent dark:bg-slate-700 dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-600/80"
              title="Test Music Clips"
            >
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </button>
            <ThemeToggle />
            {/*  Divider */}
            <hr className="w-px h-6 shrink-0 border-0 bg-slate-200/90 dark:bg-slate-700" />
            <UserMenu align="right" />

          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;