'use client';

import { Navbar } from '@/widgets/navbar/ui/Navbar';
import { ResponsivePopup } from '@/shared/ui/feedback/ResponsivePopup';
import { useAdminUsersPage } from '@/features/admin-users/model/useAdminUsersPage';
import { ADMIN_USERS_TEXTS } from '@/features/admin-users/model/admin-users.constants';
import { AdminUsersCreateForm } from '@/features/admin-users/ui/AdminUsersCreateForm';
import { AdminUsersEditForm } from '@/features/admin-users/ui/AdminUsersEditForm';
import { AdminUsersTable } from '@/features/admin-users/ui/AdminUsersTable';
import type { AdminUserRole } from '@/features/admin-users/model/admin-users.types';

const ROLE_OPTIONS: Array<{ value: AdminUserRole; label: string }> = [
  { value: 'USER', label: ADMIN_USERS_TEXTS.roleUser },
  { value: 'ADMIN', label: ADMIN_USERS_TEXTS.roleAdmin },
];

export default function AdminUsersPage() {
  const {
    isReady,
    page,
    feedback,
    popup,
    users,
    usersQuery,
    createForm,
    editForm,
    editingUserId,
    createMutation,
    updateMutation,
    setPage,
    setCreateForm,
    setEditForm,
    handleCreateSubmit,
    startEdit,
    cancelEdit,
    handleEditSubmit,
    toggleRole,
    removeUser,
    closePopup,
  } = useAdminUsersPage();

  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-3xl font-bold text-card-foreground">{ADMIN_USERS_TEXTS.title}</h1>
          <p className="text-muted-foreground mt-2">{ADMIN_USERS_TEXTS.subtitle}</p>
          {feedback ? <p className="text-primary mt-3">{feedback}</p> : null}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AdminUsersCreateForm
            title={ADMIN_USERS_TEXTS.createSection}
            usernameLabel={ADMIN_USERS_TEXTS.usernameLabel}
            emailLabel={ADMIN_USERS_TEXTS.emailLabel}
            passwordLabel={ADMIN_USERS_TEXTS.passwordLabel}
            roleLabel={ADMIN_USERS_TEXTS.roleLabel}
            submitLabel={ADMIN_USERS_TEXTS.createButton}
            isPending={createMutation.isPending}
            username={createForm.username}
            email={createForm.email}
            password={createForm.password}
            role={createForm.role}
            roleOptions={ROLE_OPTIONS}
            onUsernameChange={(value) =>
              setCreateForm((current) => ({ ...current, username: value }))
            }
            onEmailChange={(value) =>
              setCreateForm((current) => ({ ...current, email: value }))
            }
            onPasswordChange={(value) =>
              setCreateForm((current) => ({ ...current, password: value }))
            }
            onRoleChange={(value) =>
              setCreateForm((current) => ({ ...current, role: value }))
            }
            onSubmit={handleCreateSubmit}
          />

          {editingUserId ? (
            <AdminUsersEditForm
              title={ADMIN_USERS_TEXTS.editSection}
              usernameLabel={ADMIN_USERS_TEXTS.usernameLabel}
              emailLabel={ADMIN_USERS_TEXTS.emailLabel}
              submitLabel={ADMIN_USERS_TEXTS.updateButton}
              cancelLabel={ADMIN_USERS_TEXTS.cancelEditButton}
              isPending={updateMutation.isPending}
              username={editForm.username}
              email={editForm.email}
              onUsernameChange={(value) =>
                setEditForm((current) => ({ ...current, username: value }))
              }
              onEmailChange={(value) =>
                setEditForm((current) => ({ ...current, email: value }))
              }
              onSubmit={handleEditSubmit}
              onCancel={cancelEdit}
            />
          ) : (
            <section className="rounded-2xl border border-border bg-card p-5 min-h-[20rem] flex items-center justify-center text-center text-muted-foreground">
              {ADMIN_USERS_TEXTS.emptyEditSection}
            </section>
          )}
        </section>

        <AdminUsersTable
          title={ADMIN_USERS_TEXTS.tableSection}
          users={users}
          isLoading={usersQuery.isLoading}
          meta={usersQuery.data?.meta}
          headers={ADMIN_USERS_TEXTS.tableHeaders}
          loadingLabel={ADMIN_USERS_TEXTS.loading}
          noResultsLabel={ADMIN_USERS_TEXTS.noResults}
          roleAdminLabel={ADMIN_USERS_TEXTS.roleAdmin}
          roleUserLabel={ADMIN_USERS_TEXTS.roleUser}
          editActionLabel={ADMIN_USERS_TEXTS.editAction}
          promoteActionLabel={ADMIN_USERS_TEXTS.promoteAction}
          demoteActionLabel={ADMIN_USERS_TEXTS.demoteAction}
          deleteActionLabel={ADMIN_USERS_TEXTS.deleteAction}
          onPageChange={(nextPage) => {
            if (nextPage !== page) {
              setPage(nextPage);
            }
          }}
          onEdit={startEdit}
          onToggleRole={toggleRole}
          onDelete={removeUser}
        />
      </main>

      <ResponsivePopup
        isOpen={popup.isOpen}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        onClose={closePopup}
      />
    </div>
  );
}
