import DashboardShell from "../../components/organisms/DashboardShell";
import ProfileSettings from "../../components/profile/ProfileSettings";
import { useAuth } from "../../context/authStore";

export default function Profile() {
  const { user, updateUser } = useAuth();
  return (
    <DashboardShell
      subtitle="Actualiza tus datos, foto y seguridad desde un solo lugar."
      title="Tu perfil"
    >
      <ProfileSettings onSaveProfile={updateUser} user={user} />
    </DashboardShell>
  );
}
