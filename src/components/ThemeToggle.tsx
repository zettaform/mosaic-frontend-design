import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border border-slate-200 bg-slate-100 p-0.5 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-offset-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] ml-2"
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* Sliding Thumb */}
      <span
        className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out dark:bg-slate-800 ${
          theme === 'dark' ? 'translate-x-[26px]' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400/20" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
        )}
      </span>

      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
        <Sun className={`h-3.5 w-3.5 transition-opacity duration-200 ${theme === 'light' ? 'opacity-0' : 'text-slate-400 opacity-60'}`} />
        <Moon className={`h-3.5 w-3.5 transition-opacity duration-200 ${theme === 'dark' ? 'opacity-0' : 'text-slate-500 opacity-60'}`} />
      </div>
    </button>
  )
}

export default ThemeToggle

