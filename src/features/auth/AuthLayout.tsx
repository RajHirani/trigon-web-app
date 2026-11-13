import type { ReactNode } from 'react'
import { LogoMark } from '@/components/Logo'
import { useThemeStore } from '@/store/themeStore'
import leftDesktop from '@/assets/auth/trigon-login-desktop-left.svg'
import mobileHeader from '@/assets/auth/trigon-login-mobile-header.svg'
import rightDesktopLight from '@/assets/auth/trigon-login-right-desktop-light.svg'
import rightDesktopDark from '@/assets/auth/trigon-login-right-desktop-dark.svg'
import rightMobileLight from '@/assets/auth/trigon-login-right-mobile-light.svg'
import rightMobileDark from '@/assets/auth/trigon-login-right-mobile-dark.svg'

// Shared chrome of the Auth screens (Figma sections 22-25): brand panel on the
// left from lg up (a banner above the card below it), form card, street scene.
export function AuthLayout({ children }: { children: ReactNode }) {
  const dark = useThemeStore((s) => s.mode) === 'dark'
  return (
    <div className="flex min-h-full flex-col bg-app lg:flex-row">
      {/* Brand panel (desktop) */}
      <section className="relative hidden w-1/2 overflow-hidden bg-auth-panel lg:block">
        <img src={leftDesktop} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: dark ? 0.5 : 1 }} />
        <div className="relative flex h-full flex-col justify-center px-[10%] text-white">
          <div className="flex items-center gap-4">
            <LogoMark white className="h-14 w-16" />
            <span className="text-4xl font-semibold tracking-wide">TRIGON</span>
          </div>
          <h2 className="mt-10 text-xl font-medium">Every vehicle. One live view.</h2>
          <p className="mt-2 max-w-sm text-sm text-white/80">Track, replay and manage your fleet in real time.</p>
        </div>
        <p className="absolute bottom-6 left-12 text-xs text-white/70">© 2026 TRIGON GPS · Privacy · Terms</p>
      </section>

      {/* Brand banner (below lg) */}
      <div className="relative bg-auth-panel lg:hidden">
        <img src={mobileHeader} alt="" className="block h-[234px] w-full object-cover sm:h-[270px]" style={{ opacity: dark ? 0.5 : 1 }} />
        <div className="absolute inset-0 flex items-center justify-center gap-3 text-white">
          <LogoMark white className="h-10 w-11" />
          <span className="text-3xl font-semibold tracking-wide">TRIGON</span>
        </div>
      </div>

      {/* Form side */}
      <section className="relative -mt-12 flex flex-1 items-start justify-center overflow-hidden px-4 pb-52 lg:mt-0 lg:items-center lg:pb-40">
        <div className="relative z-10 w-full max-w-[378px] rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {children}
        </div>
        <img src={dark ? rightDesktopDark : rightDesktopLight} alt="" className="pointer-events-none absolute inset-x-0 bottom-0 hidden w-full lg:block" />
        <img src={dark ? rightMobileDark : rightMobileLight} alt="" className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-[540px] lg:hidden" />
      </section>
    </div>
  )
}
