'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Image as ImageIcon } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import { OverlayPortal } from '@/components/shared/OverlayPortal';
import { useFocusTrap } from '@/hooks/use-focus-trap';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (url: string) => void;
}

export function ProfilePhotoModal({ isOpen, onClose, onSave }: ProfilePhotoModalProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (event.target.files && event.target.files[0]) {
      handleFile(event.target.files[0]);
    }
  };

  const handleSave = () => {
    if (previewUrl && onSave) {
      onSave(previewUrl);
      onClose();
    }
  };

  useFocusTrap({
    active: isOpen,
    containerRef: modalRef,
    onEscape: onClose,
  });

  return (
    <OverlayPortal>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal flex items-center justify-center bg-ruah-950/60 p-6 backdrop-blur-md"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              role="dialog"
              aria-modal="true"
              aria-label="Foto de perfil"
              ref={modalRef}
              tabIndex={-1}
              className="relative w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-fancy"
              onClick={(event) => event.stopPropagation()}
            >
              <button onClick={onClose} className="absolute right-6 top-6 rounded-full p-2 transition-colors hover:bg-ruah-50">
                <X size={20} />
              </button>

              <div className="flex flex-col items-center gap-6 text-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-ruah-50 text-accent-gold">
                  <Camera size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-serif italic uppercase text-ruah-950">Foto de Perfil</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ruah-400">Personalize seu chamado na UseRuah</p>
                </div>

                <div
                  className={`relative flex aspect-square w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] border-2 border-dashed transition-all ${
                    dragActive ? 'border-accent-gold bg-accent-gold/5' : 'border-ruah-100 bg-ruah-50/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <div className="relative h-full w-full">
                      <AppImage context="content-banner" src={previewUrl} alt="Preview" fill className="object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <button type="button" onClick={() => setPreviewUrl(null)} className="rounded-xl bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-ruah-950">
                          Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-ruah-200">
                        <ImageIcon size={32} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-ruah-950">Arraste sua foto aqui</p>
                        <p className="mt-1 text-[9px] font-medium uppercase tracking-widest text-ruah-400">ou</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-ruah-950 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-accent-gold"
                      >
                        Escolher Arquivo
                      </button>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
                </div>

                <div className="mt-4 flex w-full gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-2xl border border-ruah-100 py-4 text-[10px] font-bold uppercase tracking-widest text-ruah-400 transition-all hover:bg-ruah-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!previewUrl}
                    onClick={handleSave}
                    className="flex-1 rounded-2xl bg-ruah-950 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-accent-gold disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Salvar Foto
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
