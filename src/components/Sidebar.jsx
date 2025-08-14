import React from 'react';
import { User, Lock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Sidebar({ isAuthenticated, onLoginClick, onLogout }) {
  const { t } = useTranslation();
  
  return (
    <div className="fixed top-0 left-0 h-screen w-16 md:w-20 bg-white dark:bg-slate-800 shadow-lg z-40 flex flex-col items-center pt-20">
      <button 
        onClick={isAuthenticated ? onLogout : onLoginClick}
        className="mt-8 flex flex-col items-center justify-center text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {isAuthenticated ? (
          <>
            <Lock className="h-6 w-6" />
            <span className="text-xs mt-1">{t('logout')}</span>
          </>
        ) : (
          <>
            <User className="h-6 w-6" />
            <span className="text-xs mt-1">{t('login')}</span>
          </>
        )}
      </button>
    </div>
  );
}