// Sent at sign-in so the server can list this browser session.
// TODO(backend): confirm trigon-api accepts device_platform "web" (mobile sends ios | android).
export function getDeviceDescription() {
  const ua = navigator.userAgent
  const browser =
    /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS'
  return {
    platform: 'web' as const,
    name: `${browser} on ${os}`,
    appVersion: __APP_VERSION__,
    osVersion: os,
  }
}
