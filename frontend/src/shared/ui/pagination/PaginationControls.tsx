import { PaginationMeta } from '@/entities/movie/model/types';
import { Button } from '../button/Button';

interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  meta,
  onPageChange,
  className = '',
}: PaginationControlsProps) {
  if (meta.totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 ${className}`}>
      <Button
        variant="outline"
        className="h-11 w-full sm:w-auto px-4 py-0"
        disabled={!meta.hasPreviousPage}
        onClick={() => onPageChange(meta.page - 1)}
      >
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground text-center">
        Pagina {meta.page} de {meta.totalPages} ({meta.total} itens)
      </span>

      <Button
        variant="outline"
        className="h-11 w-full sm:w-auto px-4 py-0"
        disabled={!meta.hasNextPage}
        onClick={() => onPageChange(meta.page + 1)}
      >
        Proxima
      </Button>
    </div>
  );
}
