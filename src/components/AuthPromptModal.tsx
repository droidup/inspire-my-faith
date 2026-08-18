import React from 'react';
import { X, Cloud, HardDrive, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToBrowser: () => void;
  title?: string;
  description?: string;
}

export default function AuthPromptModal({ 
  isOpen, 
  onClose, 
  onSaveToBrowser,
  title = "Save Your Data",
  description = "You are not logged in. How would you like to save this?"
}: AuthPromptModalProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose(); // Close modal upon successful sign-in
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-8 pr-8">
          <h2 className="text-2xl font-serif text-slate-800 mb-2">{title}</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => {
              onSaveToBrowser();
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-stone-200 hover:border-[#c2094c] hover:bg-stone-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:text-[#c2094c] group-hover:bg-[#c2094c]/10 transition-colors">
                <HardDrive size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800 group-hover:text-[#c2094c] transition-colors">Save to Browser</div>
                <div className="text-xs text-stone-500">Data stays on this device only</div>
              </div>
            </div>
          </button>

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-[#c2094c] bg-[#c2094c] hover:bg-[#a0073e] hover:border-[#a0073e] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Cloud size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-white">Login to Sync</div>
                <div className="text-xs text-white/80">Save across all devices</div>
              </div>
            </div>
            <LogIn size={20} className="text-white/50 group-hover:text-white transition-colors mr-2" />
          </button>
        </div>

        <p className="text-center text-xs text-stone-400 mt-6 px-4">
          If you save to your browser now, it will automatically sync next time you log in!
        </p>
      </div>
    </div>
  );
}
