import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../atoms/Button";
import Card from "../atoms/Card";
import Input from "../atoms/Input";
import PasswordField from "../molecules/PasswordField";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/authStore";

const EMPTY_PASSWORDS = {
  confirmation: "",
  currentPassword: "",
  newPassword: "",
};

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function validPassword(value) {
  return (
    value.length >= 8 &&
    /[A-ZÁÉÍÓÚÑ]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/.test(value)
  );
}

export default function ProfileSettings({
  onSaveProfile,
  siteReadOnly = false,
  user,
}) {
  const { changePassword } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [profile, setProfile] = useState(user);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const passwordSubmissionRef = useRef(false);

  useEffect(() => {
    queueMicrotask(() => setProfile(user));
  }, [user]);

  const passwordReady = useMemo(
    () =>
      passwords.currentPassword.length >= 8 &&
      validPassword(passwords.newPassword) &&
      passwords.newPassword === passwords.confirmation &&
      passwords.newPassword !== passwords.currentPassword,
    [passwords],
  );

  if (!profile) return null;

  const updateProfile = (key, value) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast({
        title: "Archivo no válido",
        message: "Selecciona una imagen JPG, PNG o WebP.",
        tone: "error",
      });
      return;
    }
    if (file.size > 1024 * 1024) {
      showToast({
        title: "Imagen demasiado grande",
        message: "La foto debe pesar como máximo 1 MB.",
        tone: "error",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateProfile("avatarUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        avatarUrl: profile.avatarUrl || "",
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
      };
      if (!siteReadOnly) payload.site = profile.site || "";
      await onSaveProfile(payload);
      showToast({ title: "Perfil actualizado", tone: "success" });
    } catch (error) {
      showToast({
        title: "No se pudo guardar el perfil",
        message: error.message,
        tone: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (!passwordReady) {
      showToast({
        title: "Revisa la nueva contraseña",
        message: "Debe cumplir todos los requisitos y ambas contraseñas deben coincidir.",
        tone: "error",
      });
      return;
    }
    if (passwordSubmissionRef.current) return;
    passwordSubmissionRef.current = true;
    setSavingPassword(true);
    try {
      const response = await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords(EMPTY_PASSWORDS);
      showToast({
        title: "Contraseña actualizada",
        message: response.message,
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "No se pudo cambiar la contraseña",
        message: error.message,
        tone: "error",
      });
    } finally {
      passwordSubmissionRef.current = false;
      setSavingPassword(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl overflow-hidden p-0">
      <div
        aria-label="Configuración de la cuenta"
        className="grid grid-cols-2 gap-1 border-b border-outline-variant bg-surface-container-low p-2"
        role="tablist"
      >
        <button
          aria-selected={activeTab === "profile"}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${activeTab === "profile" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-white"}`}
          disabled={savingPassword || savingProfile}
          onClick={() => setActiveTab("profile")}
          role="tab"
          type="button"
        >
          <span className="material-symbols-outlined text-xl">person</span>
          Datos personales
        </button>
        <button
          aria-selected={activeTab === "password"}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${activeTab === "password" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-white"}`}
          disabled={savingPassword || savingProfile}
          onClick={() => setActiveTab("password")}
          role="tab"
          type="button"
        >
          <span className="material-symbols-outlined text-xl">lock</span>
          Contraseña
        </button>
      </div>

      {activeTab === "profile" ? (
        <form onSubmit={submitProfile} role="tabpanel">
          <div className="flex flex-col gap-4 bg-gradient-to-br from-primary-fixed via-white to-white p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-primary text-2xl font-bold text-white shadow-md sm:size-28">
              {profile.avatarUrl ? (
                <img
                  alt={`Foto de ${profile.name}`}
                  className="h-full w-full object-cover"
                  src={profile.avatarUrl}
                />
              ) : (
                initials(profile.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold">{profile.name}</h2>
              <p className="text-sm text-on-surface-variant">{profile.site}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-white transition hover:brightness-95">
                  <span className="material-symbols-outlined text-lg">
                    add_a_photo
                  </span>
                  {profile.avatarUrl ? "Cambiar foto" : "Agregar foto"}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={selectPhoto}
                    type="file"
                  />
                </label>
                {profile.avatarUrl ? (
                  <button
                    className="min-h-10 rounded-xl px-3 text-sm font-bold text-error hover:bg-error-container"
                    onClick={() => updateProfile("avatarUrl", "")}
                    type="button"
                  >
                    Quitar foto
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">
                Foto opcional · JPG, PNG o WebP · máximo 1 MB
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <Input
              label="Nombre"
              maxLength="120"
              minLength="2"
              onChange={(event) => updateProfile("name", event.target.value)}
              required
              value={profile.name || ""}
            />
            <Input
              label="Correo"
              maxLength="254"
              onChange={(event) => updateProfile("email", event.target.value)}
              required
              type="email"
              value={profile.email || ""}
            />
            <Input
              inputMode="numeric"
              label="Teléfono"
              maxLength="9"
              minLength="9"
              onChange={(event) =>
                updateProfile("phone", event.target.value.replace(/\D/g, ""))
              }
              pattern="9[0-9]{8}"
              required
              value={profile.phone || ""}
            />
            <Input
              disabled={siteReadOnly}
              label={siteReadOnly ? "Sede asignada" : "Sede"}
              maxLength="120"
              onChange={(event) => updateProfile("site", event.target.value)}
              value={profile.site || ""}
            />
            <div className="flex justify-end sm:col-span-2">
              <Button disabled={savingProfile} type="submit">
                {savingProfile ? "Guardando..." : "Guardar perfil"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form
          aria-busy={savingPassword}
          className="p-4 sm:p-5"
          onSubmit={submitPassword}
          role="tabpanel"
        >
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-primary-fixed p-4 text-on-primary-fixed-variant">
            <span className="material-symbols-outlined mt-0.5 text-primary">
              shield_lock
            </span>
            <div>
              <h2 className="font-bold">Protege el acceso a tu cuenta</h2>
              <p className="mt-1 text-sm">
                Confirma tu contraseña actual y crea una diferente. El cambio se
                aplica inmediatamente.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              autoComplete="current-password"
              className="sm:col-span-2"
              disabled={savingPassword}
              enforcePolicy={false}
              id="currentPassword"
              label="Contraseña actual"
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
              required
              value={passwords.currentPassword}
            />
            <PasswordField
              disabled={savingPassword}
              id="newPassword"
              label="Nueva contraseña"
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
              required
              showFeedback
              value={passwords.newPassword}
            />
            <PasswordField
              compareTo={passwords.newPassword}
              disabled={savingPassword}
              id="passwordConfirmation"
              label="Confirmar nueva contraseña"
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  confirmation: event.target.value,
                }))
              }
              required
              value={passwords.confirmation}
            />
          </div>
          {passwords.newPassword &&
          passwords.newPassword === passwords.currentPassword ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-error">
              <span className="material-symbols-outlined text-base">error</span>
              La nueva contraseña debe ser diferente de la actual.
            </p>
          ) : null}
          <div className="mt-5 flex justify-end">
            <Button
              disabled={!passwordReady}
              loading={savingPassword}
              loadingLabel="Actualizando contraseña..."
              type="submit"
            >
              Cambiar contraseña
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
