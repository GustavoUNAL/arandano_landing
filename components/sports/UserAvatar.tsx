const DEFAULT_AVATAR = '/images/default-avatar.svg'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
}

export default function UserAvatar({ src, name, size = 64, className = '' }: UserAvatarProps) {
  const alt = name ? `Foto de ${name}` : 'Usuario'
  const imgSrc = src?.trim() ? src : DEFAULT_AVATAR

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover border-2 border-white/30 bg-berry-800 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.src = DEFAULT_AVATAR
      }}
    />
  )
}
