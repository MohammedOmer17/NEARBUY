// On phones the app is full width. On larger screens it sits in a centred phone-width column.
export default function PhoneFrame({ children, className = '' }) {
  return <div className={`relative mx-auto min-h-dvh w-full max-w-md bg-canvas md:shadow-float ${className}`}>{children}</div>
}
