'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/shared/store/store';
import { logout } from '@/features/auth/model/authSlice';
import { AdminMovieForm } from '@/features/admin/ui/AdminMovieForm';
import { Button } from '@/shared/ui/button/Button';
import { useAdminMovies } from '@/features/admin/model/useAdminMovies';
import type { AppDispatch } from '@/shared/store/store';
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls';
import type { Movie } from '@/entities/movie/model/types';
import { authApi } from '@/features/auth/api/auth.api';

const ADMIN_TEXTS = {
    title: 'Painel Admin',
    storeBtn: 'Loja',
    auditBtn: 'Auditoria',
    creditsBtn: 'Creditos',
    usersBtn: 'Usuarios',
    logoutBtn: 'Sair',
    addMovieBtn: '+ Adicionar Filme',
    cancelBtn: 'Cancelar',
    tableHeaders: ['Título', 'Gênero', 'Preço', 'Ações'],
    loading: 'Carregando...',
    deleteBtn: 'Deletar'
};

export default function AdminDashboard() {
  const [page, setPage] = React.useState(1);
  const limit = 10;
  const { user, isAuthenticated, isHydrated } = useSelector(
    (state: RootState) => state.auth,
  );
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const {
    isCreating,
    setIsCreating,
    newMovie,
    setNewMovie,
    setFile,
    moviesQuery,
    movies,
    paginationMeta,
    createMutation,
    deleteMutation,
  } = useAdminMovies({
    enabled: Boolean(isHydrated && isAuthenticated && user?.role === 'ADMIN'),
    page,
    limit,
  });

  React.useEffect(() => {
    if (isHydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router, user]);

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    createMutation.mutate(newMovie);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch(logout());
      router.push('/');
    }
  };

  if (!isHydrated || !isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-card p-6 rounded-lg shadow-md border border-border">
          <h1 className="text-3xl font-bold text-card-foreground text-center md:text-left">
            {ADMIN_TEXTS.title}
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              className="h-11 py-0 px-4 shadow-none font-normal"
              onClick={() => router.push('/')}
            >
              {ADMIN_TEXTS.storeBtn}
            </Button>
            <Button
              variant="outline"
              className="h-11 py-0 px-4 shadow-none font-normal"
              onClick={() => router.push('/admin/audit')}
            >
              {ADMIN_TEXTS.auditBtn}
            </Button>
            <Button
              variant="outline"
              className="h-11 py-0 px-4 shadow-none font-normal"
              onClick={() => router.push('/admin/credits')}
            >
              {ADMIN_TEXTS.creditsBtn}
            </Button>
            <Button
              variant="outline"
              className="h-11 py-0 px-4 shadow-none font-normal"
              onClick={() => router.push('/admin/users')}
            >
              {ADMIN_TEXTS.usersBtn}
            </Button>
            <Button
              variant="secondary"
              className="h-11 py-0 px-4 shadow-none font-normal bg-red-600 text-white hover:bg-red-700"
              onClick={() => void handleLogout()}
            >
              {ADMIN_TEXTS.logoutBtn}
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <Button
            onClick={() => setIsCreating(!isCreating)}
            className="w-auto mb-4 font-bold shadow-md"
          >
            {isCreating ? ADMIN_TEXTS.cancelBtn : ADMIN_TEXTS.addMovieBtn}
          </Button>

          {isCreating && (
            <AdminMovieForm
              newMovie={newMovie}
              setNewMovie={setNewMovie}
              setFile={setFile}
              handleCreate={handleCreate}
              isPending={createMutation.isPending}
            />
          )}
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/10 text-card-foreground">
                {ADMIN_TEXTS.tableHeaders.map((header, index) => (
                  <th key={header} className={`p-4 ${index === 3 ? 'text-right' : ''}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-card-foreground">
              {moviesQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center">
                    {ADMIN_TEXTS.loading}
                  </td>
                </tr>
              ) : (
                movies.map((movie: Movie) => (
                  <tr
                    key={movie.id}
                    className="border-t border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">{movie.title}</td>
                    <td className="p-4">{movie.genre}</td>
                    <td className="p-4">R$ {Number(movie.price).toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(movie.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        {ADMIN_TEXTS.deleteBtn}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginationMeta && (
          <PaginationControls
            meta={paginationMeta}
            onPageChange={setPage}
            className="max-w-xl mx-auto"
          />
        )}
      </div>
    </div>
  );
}
