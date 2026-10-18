import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export interface POSLayoutContextType {
  isPOSZenMode: boolean;
  setIsPOSZenMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleZenMode: () => void;
}

export default function MainLayout() {
  const location = useLocation();
  const isPOS = location.pathname === '/pos';
  const [isPOSZenMode, setIsPOSZenMode] = useState<boolean>(() => {
    return localStorage.getItem('threadly_pos_zen') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('threadly_pos_zen', String(isPOSZenMode));
  }, [isPOSZenMode]);

  const toggleZenMode = () => {
    setIsPOSZenMode((prev) => !prev);
  };

  const hideNavigation = isPOS && isPOSZenMode;

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden select-none transition-colors">
      {!hideNavigation && <Sidebar />}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {!hideNavigation && <TopBar />}
        <main className={isPOS ? "flex-1 h-full overflow-hidden p-0 bg-gray-50 dark:bg-slate-950" : "flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-slate-950 transition-colors"}>
          <div className={isPOS ? "h-full w-full" : "max-w-7xl mx-auto"}>
            <Outlet context={{ isPOSZenMode, setIsPOSZenMode, toggleZenMode }} />
          </div>
        </main>
      </div>
    </div>
  );
}
