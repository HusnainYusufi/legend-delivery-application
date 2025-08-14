import React, { useEffect } from 'react';
import { X, User, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Drawer({ 
  isOpen, 
  onClose, 
  isAuthenticated, 
  onLoginClick, 
  onLogout 
}) {
  const { t } = useTranslation();
  
  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('.drawer-content')) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.classList.add('overflow-hidden');
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-64 md:w-72 bg-white dark:bg-slate-800 shadow-xl z-50 drawer-content transform transition-transform translate-x-0">
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('menu')}</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4">
          <button 
            onClick={isAuthenticated ? onLogout : onLoginClick}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isAuthenticated ? (
              <>
                <Lock className="h-5 w-5" />
                <span className="text-base">{t('logout')}</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                <span className="text-base">{t('login')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}