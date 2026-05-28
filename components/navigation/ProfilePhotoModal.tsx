'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (url: string) => void;
}

export function ProfilePhotoModal({ isOpen, onClose, onSave }: ProfilePhotoModalProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSave = () => {
    if (previewUrl && onSave) {
      onSave(previewUrl);
      onClose();
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ruah-950/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-fancy relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-ruah-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 bg-ruah-50 rounded-2xl flex items-center justify-center text-accent-gold mb-2">
                <Camera size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif italic uppercase font-black text-ruah-950">Foto de Perfil</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ruah-400">Personalize seu chamado na UseRuah</p>
              </div>

              <div 
                className={`w-full aspect-square rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 relative overflow-hidden ${
                  dragActive ? "border-accent-gold bg-accent-gold/5" : "border-ruah-100 bg-ruah-50/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <AppImage context="content-banner" 
                      src={previewUrl} 
                      alt="Preview" 
                      fill 
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                         onClick={() => setPreviewUrl(null)}
                         className="bg-white text-ruah-950 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                       >
                         Remover
                       </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-ruah-200">
                      <ImageIcon size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-ruah-950">Arraste sua foto aqui</p>
                      <p className="text-[9px] font-medium uppercase tracking-widest text-ruah-400 mt-1">ou</p>
                    </div>
                    <button 
                      onClick={onButtonClick}
                      className="px-6 py-3 bg-ruah-950 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent-gold transition-all"
                    >
                      Escolher Arquivo
                    </button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>

              <div className="w-full flex gap-4 mt-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 border border-ruah-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-ruah-400 hover:bg-ruah-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  disabled={!previewUrl}
                  onClick={handleSave}
                  className="flex-1 py-4 bg-ruah-950 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Salvar Foto
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

