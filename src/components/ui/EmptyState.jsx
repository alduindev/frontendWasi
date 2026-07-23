import Button from './Button'

export default function EmptyState({ action, description, icon = 'inventory_2', title }) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-8 text-center">
      <span className="material-symbols-outlined text-5xl text-outline">{icon}</span>
      <h2 className="mt-3 text-lg font-bold text-on-surface">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">{description}</p>
      {action ? <div className="mt-5"><Button {...action} /></div> : null}
    </div>
  )
}
