import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import UpdateActivityForm from './UpdateActivityForm'
import { Activity } from '@/types/types'

interface UpdateActivityModalProps {
  tripId: string | string[]
  activity: Activity
  onSuccess?: () => void
  children: React.ReactNode
}

export default function UpdateActivityModal({
  tripId,
  activity,
  onSuccess,
  children,
}: UpdateActivityModalProps) {
  const [open, setOpen] = React.useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className='w-full'>
        {children}
      </DialogTrigger>
      <DialogContent>
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
