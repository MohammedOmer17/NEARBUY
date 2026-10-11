export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      {Icon && <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600"><Icon className="h-8 w-8" /></div>}
      <h2 className="text-lg font-bold">{title}</h2>
      {text && <p className="mt-1.5 max-w-xs text-sm leading-6 text-mute">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
