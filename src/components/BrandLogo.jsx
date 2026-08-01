import { BRAND_LOGO, BRAND_LOGO_LG, BRAND_NAME } from '../config/brand'

const SIZES = {
  sm: { src: BRAND_LOGO, width: 32, height: 32, className: 'h-8 w-8' },
  md: { src: BRAND_LOGO, width: 48, height: 48, className: 'h-12 w-12' },
  header: { src: BRAND_LOGO, width: 72, height: 72, className: 'h-11 w-11 sm:h-12 sm:w-12' },
  lg: { src: BRAND_LOGO_LG, width: 112, height: 112, className: 'h-28 w-28' },
  xl: { src: BRAND_LOGO_LG, width: 88, height: 88, className: 'h-[5.5rem] w-[5.5rem]' },
}

/** Same BPX / BpxPro mark as the public website header. */
export default function BrandLogo({
  src,
  size = 'md',
  className = '',
  rounded = 'xl',
  shadow = false,
}) {
  const preset = SIZES[size] || SIZES.md
  const logoSrc = src || preset.src
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded] || 'rounded-xl'

  return (
    <img
      src={logoSrc}
      alt={BRAND_NAME}
      width={preset.width}
      height={preset.height}
      className={`shrink-0 object-contain ${preset.className} ${roundedClass} ${
        shadow ? 'shadow-lg shadow-black/30' : ''
      } ${className}`.trim()}
      decoding="async"
      fetchPriority={size === 'lg' || size === 'xl' ? 'high' : undefined}
    />
  )
}
