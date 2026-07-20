import {
  CircleDot,
  Trophy,
  Dices,
  Tv,
  Dog,
  Globe,
  Gamepad2,
} from 'lucide-react'
import { useModal } from '../context/ModalContext'

const categories = [
  { icon: CircleDot, label: 'Cricket', color: 'text-green-400', hot: true },
  { icon: Trophy, label: 'Soccer', color: 'text-blue-400' },
  { icon: CircleDot, label: 'Tennis', color: 'text-yellow-400' },
  { icon: Dog, label: 'Horse Race', color: 'text-orange-400' },
  { icon: Dices, label: 'Star Casino', color: 'text-purple-400', hot: true },
  { icon: Globe, label: 'World Casino', color: 'text-cyan-400' },
  { icon: Tv, label: 'Live TV', color: 'text-red-400' },
  { icon: Gamepad2, label: 'Royal Casino', color: 'text-pink-400' },
]

export default function Categories() {
  const { openModal } = useModal()

  return (
    <section className="bg-navy-dark px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Sports &amp; Casino
          </h2>
          <span className="text-xs font-medium text-accent">Swipe →</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:grid sm:grid-cols-8 sm:overflow-visible sm:gap-3">
          {categories.map(({ icon: Icon, label, color, hot }) => (
            <button
              key={label}
              type="button"
              onClick={() => openModal('register', { registerPath: 'whatsapp' })}
              aria-label={`Register to bet on ${label}`}
              className="relative flex min-h-[4.5rem] w-[72px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded border border-border bg-navy-light p-2.5 transition-all hover:border-accent/40 hover:bg-surface-hover active:scale-95 sm:w-auto sm:p-3"
            >
              {hot && (
                <span className="absolute -top-1.5 -right-1 rounded bg-accent px-1 py-px text-[8px] font-bold text-navy-dark">
                  HOT
                </span>
              )}
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
              <span className="text-center text-xs font-medium leading-tight text-text">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
