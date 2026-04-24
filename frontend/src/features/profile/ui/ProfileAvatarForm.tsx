import { FormEvent } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { FileInput } from '@/shared/ui/file-input/FileInput';

interface ProfileAvatarFormProps {
  title: string;
  submitLabel: string;
  avatarUrl?: string | null;
  selectedAvatarPreviewUrl?: string | null;
  selectedFileName?: string;
  isPending: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent) => void;
}

export function ProfileAvatarForm({
  title,
  submitLabel,
  avatarUrl,
  selectedAvatarPreviewUrl,
  selectedFileName,
  isPending,
  onFileChange,
  onSubmit,
}: ProfileAvatarFormProps) {
  const previewUrl = selectedAvatarPreviewUrl || avatarUrl;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-5 min-h-[19rem] flex flex-col justify-between"
    >
      <div>
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>
        <div className="space-y-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-full mx-auto object-cover border border-border shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              Sem avatar
            </div>
          )}
          <FileInput
            label="Arquivo de imagem"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
          {selectedFileName && (
            <p className="text-xs text-center text-muted-foreground">
              Arquivo selecionado: {selectedFileName}
            </p>
          )}
        </div>
      </div>
      <Button type="submit" isLoading={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
