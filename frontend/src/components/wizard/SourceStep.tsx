import React from 'react';
import { UploadCloud, Sparkles, ArrowRight } from 'lucide-react';
import { Dropzone } from './Dropzone';
import type { SourceConfig } from '../../types/lessonRequest';

interface SourceStepProps {
  sourceConfig: SourceConfig;
  onChangeSource: (config: SourceConfig) => void;
  onNext: () => void;
}

export const SourceStep: React.FC<SourceStepProps> = ({
  sourceConfig,
  onChangeSource,
  onNext,
}) => {
  const isUploadMode = sourceConfig.mode === 'upload';

  const handleUploadSuccess = (materialId: string, filename: string, chunkCount: number) => {
    onChangeSource({
      mode: 'upload',
      materialId,
      filename,
      chunkCount,
    });
  };

  const handleClearUpload = () => {
    onChangeSource({
      mode: 'upload',
      materialId: '',
      filename: '',
      chunkCount: 0,
    });
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeSource({
      mode: 'topic',
      topic: e.target.value,
    });
  };

  const canContinue = isUploadMode
    ? Boolean(sourceConfig.materialId && sourceConfig.materialId.trim().length > 0)
    : Boolean(sourceConfig.topic && sourceConfig.topic.trim().length >= 3);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Mode Selection Tabs */}
      <div className="grid grid-cols-2 gap-3 p-1.5 rounded-[20px] bg-app-surface border border-app shadow-sm">
        <button
          type="button"
          onClick={() =>
            onChangeSource({
              mode: 'upload',
              materialId: '',
              filename: '',
              chunkCount: 0,
            })
          }
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-extrabold text-xs transition-all cursor-pointer ${
            isUploadMode
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-app-secondary hover:text-app-primary'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Material</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeSource({
              mode: 'topic',
              topic: '',
            })
          }
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-extrabold text-xs transition-all cursor-pointer ${
            !isUploadMode
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-app-secondary hover:text-app-primary'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Just Give Me a Topic</span>
        </button>
      </div>

      {/* Mode Input Content */}
      <div className="space-y-4">
        {isUploadMode ? (
          <Dropzone
            onUploadSuccess={handleUploadSuccess}
            onClear={handleClearUpload}
            initialMaterialId={sourceConfig.materialId}
            initialFilename={sourceConfig.filename}
            initialChunkCount={sourceConfig.chunkCount}
          />
        ) : (
          <div className="p-6 rounded-[24px] bg-app-surface border border-app space-y-4 shadow-sm">
            <div className="space-y-1">
              <label htmlFor="topic-input" className="block text-sm font-extrabold text-app-primary">
                What do you want to learn today?
              </label>
              <p className="text-xs text-app-secondary">
                Enter any concept, field, or subject (e.g. "Quantum Computing", "Organic Chemistry", "React Hooks").
              </p>
            </div>

            <input
              id="topic-input"
              type="text"
              value={sourceConfig.topic}
              onChange={handleTopicChange}
              placeholder="e.g. Machine Learning Decision Trees"
              className="w-full px-4 py-3 rounded-2xl bg-app-bg text-app-primary border border-app focus:outline-none focus:border-amber-400 text-sm font-semibold placeholder:text-app-secondary/50"
            />
          </div>
        )}
      </div>

      {/* Continue Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-extrabold text-xs transition-all shadow-md ${
            canContinue
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer'
              : 'bg-app-surface text-app-secondary opacity-50 cursor-not-allowed border border-app shadow-none'
          }`}
        >
          <span>Continue to Preferences</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
