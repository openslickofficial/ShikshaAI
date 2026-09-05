import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';
import { uploadMaterial } from '../../api/materialsApi';

interface DropzoneProps {
  onUploadSuccess: (materialId: string, filename: string, chunkCount: number) => void;
  onClear: () => void;
  initialFilename?: string;
  initialChunkCount?: number;
  initialMaterialId?: string;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const Dropzone: React.FC<DropzoneProps> = ({
  onUploadSuccess,
  onClear,
  initialFilename,
  initialChunkCount,
  initialMaterialId,
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`Invalid file format '${file.name}'. Only .pdf, .docx, and .pptx are supported.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size exceeds 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const res = await uploadMaterial(file);
      setIsUploading(false);
      onUploadSuccess(res.materialId, res.filename, res.chunkCount);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'Failed to upload and process material.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setUploadError(null);
    setIsUploading(false);
    onClear();
  };

  // 1. Success Ready State
  if (initialMaterialId && initialFilename) {
    return (
      <div className="p-6 rounded-[24px] bg-app-surface border border-emerald-500/30 text-left space-y-4 shadow-sm relative">
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-app-bg text-app-secondary hover:text-app-primary transition-colors cursor-pointer"
          title="Remove material"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-base text-app-primary truncate max-w-[280px]">
                {initialFilename}
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Ready · {initialChunkCount || 0} sections indexed
              </span>
            </div>
            <p className="text-xs text-app-secondary">
              Document parsed & stored in ChromaDB vector store. Ready for lesson planning.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Uploading Processing State
  if (isUploading) {
    return (
      <div className="p-8 rounded-[24px] bg-app-surface border border-app text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-base text-app-primary">
            Uploading & processing material...
          </h4>
          <p className="text-xs text-app-secondary">
            Extracting text, building sliding-window chunks, and generating embeddings.
          </p>
        </div>
      </div>
    );
  }

  // 3. Error State with Retry
  if (uploadError) {
    return (
      <div className="p-6 rounded-[24px] bg-app-surface border border-red-500/30 text-center space-y-4 shadow-sm">
        <div className="w-10 h-10 rounded-2xl bg-app-danger text-app-danger flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-app-primary">Processing Error</h4>
          <div className="p-3 rounded-xl bg-app-danger text-app-danger text-xs font-bold border border-red-500/20 max-w-md mx-auto">
            {uploadError}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold hover:bg-amber-300 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Another File</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Default Dropzone Area
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="p-8 rounded-[24px] border-2 border-dashed border-app hover:border-amber-400/60 bg-app-surface transition-all text-center space-y-4 cursor-pointer relative"
    >
      <input
        type="file"
        accept=".pdf,.docx,.pptx"
        onChange={handleFileChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />

      <div className="w-14 h-14 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center mx-auto">
        <UploadCloud className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h4 className="font-extrabold text-base text-app-primary">
          Upload reference document
        </h4>
        <p className="text-xs text-app-secondary">
          Drag and drop your file here, or click to browse.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-app-bg text-app-secondary border border-app text-[11px] font-bold">
        <span>Supports .pdf, .docx, .pptx (Max 20MB)</span>
      </div>
    </div>
  );
};
