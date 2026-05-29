export default function ProfileAvatar({ profile, sizePx = 32 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: profile.colour, width: sizePx, height: sizePx }}
    >
      <span className="text-white font-black" style={{ fontSize: sizePx * 0.45 }}>
        {profile.name[0].toUpperCase()}
      </span>
    </div>
  )
}
