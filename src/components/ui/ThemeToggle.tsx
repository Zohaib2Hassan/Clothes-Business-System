import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, type Theme } from '../../context/ThemeContext';
import clsx from 'clsx';

interface ThemeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

export default function ThemeToggle({ className, showDropdown = true }: ThemeToggleProps) {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { label: string; value: Theme; icon: typeof Sun }[] = [
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon },
    { label: 'System', value: 'system', icon: Laptop },
  ];

  if (!showDropdown) {
    return (
      <button
        onClick={toggleTheme}
        className={clsx(
          "p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center",
          isDark
            ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
          className
        )}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div className={clsx("relative inline-block", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
          isDark
            ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs"
        )}
        title="Change Appearance (Theme)"
        aria-label="Change Appearance"
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-brand-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        <span className="text-xs font-semibold hidden lg:inline capitalize">
          {theme}
        </span>
      </button>

      {isOpen && (
        <div
          className={clsx(
            "absolute right-0 top-full mt-2 w-44 rounded-2xl shadow-xl border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150",
            isDark
              ? "bg-slate-900 border-slate-700 text-slate-100"
              : "bg-white border-gray-200 text-gray-900"
          )}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60">
            Appearance
          </div>

          <div className="space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer",
                    isSelected
                      ? isDark
                        ? "bg-brand-900/60 text-brand-300 font-semibold"
                        : "bg-brand-50 text-brand-900 font-semibold"
                      : isDark
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={clsx("w-3.5 h-3.5", isSelected ? "text-brand-500" : "opacity-70")} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
