'use client';

import { Navbar } from '@/widgets/navbar/ui/Navbar';
import { ResponsivePopup } from '@/shared/ui/feedback/ResponsivePopup';
import { PROFILE_PAGE_TEXTS } from '@/features/profile/model/profile.constants';
import { useProfilePage } from '@/features/profile/model/useProfilePage';
import { ProfileHeaderSection } from '@/features/profile/ui/ProfileHeaderSection';
import { ProfileDetailsForm } from '@/features/profile/ui/ProfileDetailsForm';
import { ProfilePasswordForm } from '@/features/profile/ui/ProfilePasswordForm';
import { ProfileAvatarForm } from '@/features/profile/ui/ProfileAvatarForm';

export default function ProfilePage() {
  const {
    user,
    isReady,
    username,
    email,
    currentPassword,
    newPassword,
    avatarFile,
    avatarPreviewUrl,
    feedback,
    popup,
    updateProfileMutation,
    updatePasswordMutation,
    uploadAvatarMutation,
    setUsername,
    setEmail,
    setCurrentPassword,
    setNewPassword,
    setAvatarFile,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleAvatarSubmit,
    closePopup,
  } = useProfilePage();

  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <ProfileHeaderSection
          title={PROFILE_PAGE_TEXTS.title}
          subtitle={PROFILE_PAGE_TEXTS.subtitle}
          referralCodeLabel={PROFILE_PAGE_TEXTS.referralCodeLabel}
          referralCode={user?.referralCode}
          missingReferralCode={PROFILE_PAGE_TEXTS.missingReferralCode}
          feedbackMessage={feedback}
        />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ProfileDetailsForm
            title={PROFILE_PAGE_TEXTS.profileCard}
            saveLabel={PROFILE_PAGE_TEXTS.saveProfile}
            username={username}
            email={email}
            isPending={updateProfileMutation.isPending}
            onUsernameChange={setUsername}
            onEmailChange={setEmail}
            onSubmit={handleProfileSubmit}
          />

          <ProfilePasswordForm
            title={PROFILE_PAGE_TEXTS.passwordCard}
            saveLabel={PROFILE_PAGE_TEXTS.savePassword}
            currentPassword={currentPassword}
            newPassword={newPassword}
            isPending={updatePasswordMutation.isPending}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onSubmit={handlePasswordSubmit}
          />

          <ProfileAvatarForm
            title={PROFILE_PAGE_TEXTS.avatarCard}
            submitLabel={PROFILE_PAGE_TEXTS.uploadAvatar}
            avatarUrl={user?.avatarUrl}
            selectedAvatarPreviewUrl={avatarPreviewUrl}
            selectedFileName={avatarFile?.name}
            isPending={uploadAvatarMutation.isPending}
            onFileChange={setAvatarFile}
            onSubmit={handleAvatarSubmit}
          />
        </section>
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
