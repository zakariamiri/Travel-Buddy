'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import AddActivityForm from './AddActivityForm'
import { Button } from '@/components/ui/button'

interface AddActivityModalProps {
  tripId: string | string[]
  tripStartDate?: string
  tripEndDate?: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function AddActivityModal({
  tripId,
  tripStartDate,
  tripEndDate,
  trigger,
  onSuccess,
}: AddActivityModalProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
      ) : (
        <DialogTrigger>
          <Button className="bg-primary text-white hover:bg-primary/90 font-bold">
            + Add Activity
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Activity</DialogTitle>
        </DialogHeader>
        <AddActivityForm
          tripId={tripId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
