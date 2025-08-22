import React, { useEffect, useRef } from 'react';
import { X, User, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Drawer({ 
  isOpen, 
  onClose, 
  isAuthenticated, 
  onLoginClick, 
  onLogout,
  language
}) {
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  
  // Handle both mobile and desktop interactions
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      // Check if click is outside drawer but on overlay
      if (overlayRef.current && overlayRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    // Use both mouse and touch events for maximum compatibility
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    document.body.classList.add('overflow-hidden');

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onClose]);

  // Add Capacitor-specific touch handling
  useEffect(() => {
    if (!window.Capacitor || !isOpen) return;

    const handleBackButton = () => {
      onClose();
      return true; // Prevent default back behavior
    };

    window.Capacitor.Plugins.App.addListener('backButton', handleBackButton);

    return () => {
      window.Capacitor.Plugins.App.removeListener('backButton', handleBackButton);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay with separate ref */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        role="presentation"
      />
      
      {/* Drawer with platform-agnostic styling */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-64 bg-white dark:bg-slate-800 shadow-xl z-[101] ${
          isOpen ? 'animate-slide-in' : (isRTL ? 'animate-slide-out-left' : 'animate-slide-out-right')
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('menu')}</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label={t('close')}
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