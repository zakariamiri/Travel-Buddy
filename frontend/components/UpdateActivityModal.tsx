import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import UpdateActivityForm from './UpdateActivityForm'
import { Activity } from '@/types/types'

interface UpdateActivityModalProps {
  tripId: string | string[]
  activity: Activity
  onSuccess?: () => void
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function UpdateActivityModal({
  tripId,
  activity,
  onSuccess,
  children,
  open: controlledOpen,
  onOpenChange,
}: UpdateActivityModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen)
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen)
    }
  }

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update Activity</DialogTitle>
        </DialogHeader>
        <UpdateActivityForm
          tripId={tripId}
          activity={activity}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
