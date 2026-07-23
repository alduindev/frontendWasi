import { NavLink } from "react-router-dom";

const items = [
  { icon: "calendar_month", label: "Calendario", to: "/dashboard/calendar" },
  { icon: "hotel", label: "Estancias", to: "/dashboard/reservations" },
  { icon: "group", label: "Huéspedes", to: "/dashboard/guests" },
  { icon: "meeting_room", label: "Recepción y caja", to: "/dashboard/checkin" },
];

export default function HospitalityStayNav() {
  return (
    <nav
      aria-label="Herramientas de estancias"
      className="mb-3 flex gap-1.5 overflow-x-auto rounded-2xl border border-outline-variant bg-white p-1.5"
    >
      {items.map((item) => (
        <NavLink
          className={({ isActive }) =>
            `flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "text-on-surface-variant hover:bg-primary-fixed hover:text-primary"}`
          }
          key={item.to}
          to={item.to}
        >
          <span className="material-symbols-outlined text-lg">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
