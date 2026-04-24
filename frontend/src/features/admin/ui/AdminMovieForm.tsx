import React from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';
import { FileInput } from '@/shared/ui/file-input/FileInput';
import { CreateMoviePayload } from '@/entities/movie/model/types';

const FORM_TEXTS = {
    titlePlaceholder: 'Título',
    genrePlaceholder: 'Gênero',
    pricePlaceholder: 'Preço',
    trailerPlaceholder: 'Trailer URL (YouTube)',
    synopsisPlaceholder: 'Sinopse',
    posterLabel: 'Pôster do Filme',
    saveBtn: 'Salvar Filme',
    savingBtn: 'Salvando...',
};

interface AdminMovieFormProps {
  newMovie: CreateMoviePayload;
  setNewMovie: (movie: CreateMoviePayload) => void;
  setFile: (file: File | null) => void;
  handleCreate: (event: React.FormEvent) => void;
  isPending: boolean;
}

export function AdminMovieForm({ newMovie, setNewMovie, setFile, handleCreate, isPending }: AdminMovieFormProps) {
    return (
        <form onSubmit={handleCreate} className="bg-card p-6 rounded-xl shadow-lg space-y-4 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input required label={FORM_TEXTS.titlePlaceholder} value={newMovie.title} onChange={e => setNewMovie({ ...newMovie, title: e.target.value })} />
                <Input required label={FORM_TEXTS.genrePlaceholder} value={newMovie.genre} onChange={e => setNewMovie({ ...newMovie, genre: e.target.value })} />
                <Input required type="number" step="0.01" label={FORM_TEXTS.pricePlaceholder} value={newMovie.price} onChange={e => setNewMovie({ ...newMovie, price: Number(e.target.value) })} />
                <Input label={FORM_TEXTS.trailerPlaceholder} value={newMovie.trailerUrl ?? ''} onChange={e => setNewMovie({ ...newMovie, trailerUrl: e.target.value })} />
            </div>

            <div>
                <label className="block mb-1 font-semibold text-foreground text-sm">{FORM_TEXTS.synopsisPlaceholder}</label>
                <textarea required value={newMovie.synopsis} onChange={e => setNewMovie({ ...newMovie, synopsis: e.target.value })} className="mt-1 p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none w-full h-32" />
            </div>

            <div>
                <FileInput
                  label={FORM_TEXTS.posterLabel}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
            </div>

            <div className="flex justify-end">
                <Button disabled={isPending} type="submit" isLoading={isPending} className="w-full md:w-auto mt-2">
                    {isPending ? FORM_TEXTS.savingBtn : FORM_TEXTS.saveBtn}
                </Button>
            </div>
        </form>
    );
}
