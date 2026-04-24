import { Button } from '@/shared/ui/button/Button';
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls';
import type { PaginationMeta } from '@/entities/movie/model/types';
import type { AdminUserRecord } from '../model/admin-users.types';

interface AdminUsersTableProps {
  title: string;
  users: AdminUserRecord[];
  isLoading: boolean;
  meta?: PaginationMeta;
  headers: readonly string[];
  loadingLabel: string;
  noResultsLabel: string;
  roleAdminLabel: string;
  roleUserLabel: string;
  editActionLabel: string;
  promoteActionLabel: string;
  demoteActionLabel: string;
  deleteActionLabel: string;
  onPageChange: (page: number) => void;
  onEdit: (user: AdminUserRecord) => void;
  onToggleRole: (user: AdminUserRecord) => void;
  onDelete: (id: string) => void;
}

export function AdminUsersTable({
  title,
  users,
  isLoading,
  meta,
  headers,
  loadingLabel,
  noResultsLabel,
  roleAdminLabel,
  roleUserLabel,
  editActionLabel,
  promoteActionLabel,
  demoteActionLabel,
  deleteActionLabel,
  onPageChange,
  onEdit,
  onToggleRole,
  onDelete,
}: AdminUsersTableProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold text-card-foreground text-center mb-4">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary/10 text-card-foreground">
              {headers.map((header) => (
                <th key={header} className="p-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-card-foreground">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="p-4 text-center">
                  {loadingLabel}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="p-4 text-center">
                  {noResultsLabel}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">{user.username}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    {user.role === 'ADMIN' ? roleAdminLabel : roleUserLabel}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        className="w-auto h-10 py-0 px-3 shadow-none text-sm whitespace-nowrap"
                        onClick={() => onEdit(user)}
                      >
                        {editActionLabel}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-auto h-10 py-0 px-3 shadow-none text-sm whitespace-nowrap"
                        onClick={() => onToggleRole(user)}
                      >
                        {user.role === 'ADMIN' ? demoteActionLabel : promoteActionLabel}
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-auto h-10 py-0 px-3 shadow-none text-sm whitespace-nowrap bg-red-600 text-white hover:bg-red-700"
                        onClick={() => onDelete(user.id)}
                      >
                        {deleteActionLabel}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {meta && <PaginationControls meta={meta} onPageChange={onPageChange} />}
    </section>
  );
}
