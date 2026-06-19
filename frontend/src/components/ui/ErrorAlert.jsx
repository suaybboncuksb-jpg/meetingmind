export default function ErrorAlert({ message }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="rounded-button border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-700"
    >
      {message}
    </div>
  )
}
