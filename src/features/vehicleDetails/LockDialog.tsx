import { ConfirmDialog } from '@/components/ConfirmDialog'

type Props = {
  plate: string
  pending: boolean
  error: boolean
  onCancel: () => void
  onConfirm: () => void
}

// "Lock device" confirmation. Figma: Dashboard / Desktop / Light · View More · Lock device dialog (480px).
export function LockDialog({ plate, pending, error, onCancel, onConfirm }: Props) {
  return (
    <ConfirmDialog
      title={`Lock ${plate}?`}
      message="The device will be locked. You can switch it back to unlocked from this page whenever you need."
      confirmLabel="Lock device"
      pendingLabel="Locking…"
      pending={pending}
      error={error ? 'Couldn’t lock the device. Please try again.' : undefined}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
