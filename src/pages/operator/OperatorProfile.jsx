import OperatorShell from "../../components/operator/OperatorShell";
import ProfileSettings from "../../components/profile/ProfileSettings";
import { useAuth } from "../../context/authStore";

export default function OperatorProfile() {
  const { user, updateUser } = useAuth();

  return (
    <OperatorShell
      subtitle="Actualiza tus datos, foto y contraseña de acceso."
      title="Mi perfil"
    >
      <ProfileSettings
        onSaveProfile={updateUser}
        siteReadOnly
        user={user}
      />
    </OperatorShell>
  );
}
