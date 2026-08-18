import React from 'react';
import { X, HardDrive, UserPlus, BookOpen } from 'lucide-react';

interface SaveVerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLocal: () => void;
  onCreateAccount: () => void;
}

export default function SaveVerseModal({
  isOpen,
  onClose,
  onSaveLocal,
  onCreateAccount
}: SaveVerseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg text-[#c2094c]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900">
              Save to Faith Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-stone-600 text-sm mb-6">
            Keep track of verses that inspire you and add your personal reflections. How would you like to save this verse?
          </p>

          {/* Save to Browser Option */}
          <button
            onClick={onSaveLocal}
            className="w-full flex items-start gap-4 p-4 rounded-xl border border-stone-200 hover:border-[#c2094c] hover:bg-red-50 transition-all text-left group"
          >
            <div className="p-3 rounded-full bg-stone-50 group-hover:bg-white text-stone-500 group-hover:text-[#c2094c] transition-colors border border-stone-100 group-hover:border-red-100 shadow-sm">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-900 mb-1 group-hover:text-[#c2094c] transition-colors">Save to this Browser</h4>
              <p className="text-sm text-stone-500">
                Quick and easy. Your saved verses and notes will remain on this device only. Free, no account needed.
              </p>
            </div>
          </button>

          {/* Create Account Option */}
          <button
            onClick={onCreateAccount}
            className="w-full flex items-start gap-4 p-4 rounded-xl border border-stone-200 hover:border-[#c2094c] hover:bg-red-50 transition-all text-left group"
          >
            <div className="p-3 rounded-full bg-stone-50 group-hover:bg-white text-stone-500 group-hover:text-[#c2094c] transition-colors border border-stone-100 group-hover:border-red-100 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-900 mb-1 group-hover:text-[#c2094c] transition-colors">Create Free Account</h4>
              <p className="text-sm text-stone-500">
                Access your Faith Guide from any device. Never lose your notes if you clear your browser history.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
