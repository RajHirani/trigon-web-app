import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faCartShopping,
  faChartPie,
  faDownload,
  faDrawPolygon,
  faGauge,
  faMicrochip,
  faRoute,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'

export type MenuItem = {
  path: string
  label: string
  icon: IconDefinition
  roles?: readonly string[]
  /** Other route prefixes that keep this item highlighted (Live Track and Playback are opened from the Dashboard, so Dashboard stays lit; they are separate from Fleet Tracking). */
  alsoActiveFor?: readonly string[]
}
export type MenuGroup = { title: string; items: readonly MenuItem[] }

// Same groups and roles as the mobile menu (trigon-mobile-app/src/navigation/menu.ts) and the Figma sidebar.
export const MENU: readonly MenuGroup[] = [
  {
    title: 'Monitor',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: faGauge, alsoActiveFor: ['/live', '/playback'] },
      { path: '/fleet', label: 'Fleet Tracking', icon: faRoute },
      { path: '/geofence', label: 'Geofence', icon: faDrawPolygon },
    ],
  },
  {
    title: 'Manage',
    items: [
      { path: '/users', label: 'Users', icon: faUsers, roles: ['ADMIN', 'DEALER', 'RETAILER'] },
      { path: '/devices', label: 'Devices', icon: faMicrochip },
      { path: '/share-devices', label: 'Share Devices', icon: faCartShopping, roles: ['ADMIN', 'DEALER', 'RETAILER'] },
    ],
  },
  {
    title: 'Insights',
    items: [
      { path: '/reports', label: 'Reports', icon: faChartPie },
      { path: '/downloads', label: 'Download Reports', icon: faDownload },
      { path: '/notifications', label: 'Notifications', icon: faBell },
    ],
  },
]
