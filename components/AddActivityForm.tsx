'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'
import { ACTIVITY_TYPES } from '@/types/types'
import { FaCompass } from 'react-icons/fa'
import { toast } from 'sonner'

interface AddActivityFormProps {
  tripId: string | string[]
  tripStartDate?: string
  tripEndDate?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function AddActivityForm({
  tripId,
  tripStartDate,
  tripEndDate,
  onSuccess,
  onCancel,
}: AddActivityFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)

  const calculateDays = () => {
    if (!tripStartDate || !tripEndDate) return 0
    const start = new Date(tripStartDate)
    const end = new Date(tripEndDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1
  }

  const tripDays = calculateDays()

  const getDayDate = (dayNumber: number) => {
    if (!tripStartDate || dayNumber < 1) return tripStartDate
    const date = new Date(tripStartDate)
    date.setDate(date.getDate() + (dayNumber - 1))
    return date.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    type: 'activity',
    title: '',
    location: '',
    notes: '',
    image_url: '',
    scheduled_date: getDayDate(1),
    scheduled_time: '',
    status: 'pending',
    lat: '',
    lon: '',
  })

  React.useEffect(() => {
    const getToken = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentToken(session?.access_token || null)
    }
    getToken()
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'selectedDay') {
      const dayNumber = parseInt(value)
      const correspondingDate = getDayDate(dayNumber)
      setFormData((prev) => ({
        ...prev,
        selectedDay: value,
        scheduled_date: correspondingDate,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.title || !formData.scheduled_date) {
        setError('Title and scheduled date are required')
        setLoading(false)
        return
      }

      const payload = {
        trip_id: tripId,
        type: formData.type,
        title: formData.title,
        location: formData.location || null,
        notes: formData.notes || null,
        image_url: formData.image_url || null,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time || null,
        status: formData.status,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lon: formData.lon ? parseFloat(formData.lon) : null,
      }

      const response = await fetch(
        `http://localhost:3001/api/trips/${tripId}/activities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create activity')
      }

      const result = await response.json()
      console.log('Activity created:', result)
      toast.success('Activity added successfully', { duration: 3000 })

      setFormData({
        type: 'activity',
        title: '',
        location: '',
        notes: '',
        image_url: '',
        scheduled_date: getDayDate(1),
        scheduled_time: '',
        status: 'pending',
        lat: '',
        lon: '',
      })

      onSuccess?.()
    } catch (err) {
      console.error('Error creating activity:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
            toast.error('Failed to add activity', { duration: 3000})
    } finally {
      setLoading(false)
    }
  }

  const selectedActivityType = ACTIVITY_TYPES.find(
    (type) => type.value === formData.type
  )
  const SelectedIcon = selectedActivityType?.icon || FaCompass

  const groupedTypes = ACTIVITY_TYPES.reduce(
    (acc, type) => {
      if (!acc[type.category]) {
        acc[type.category] = []
      }
      acc[type.category].push(type)
      return acc
    },
    {} as Record<string, typeof ACTIVITY_TYPES>
  )

  const categoryOrder = [
    'Accommodation',
    'Dining',
    'Transport',
    'Sightseeing',
    'Entertainment',
    'Shopping',
    'Adventure',
    'Wellness',
  ]

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Add Activity</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Type */}
        <div>
          <Label htmlFor="type" className="block text-sm font-medium mb-2">
            Type *
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) => value && handleSelectChange('type', value)}
          >
            <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-primary focus:border-primary rounded-lg h-10">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <SelectedIcon className="text-lg text-primary" />
                  <span>{selectedActivityType?.label || 'Select type'}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {categoryOrder.map((category) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                    {category}
                  </div>
                  {groupedTypes[category]?.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="
                        flex items-center gap-2 pl-8 py-2 cursor-pointer
                        text-primary
                        data-[highlighted]:bg-primary
                      data-[highlighted]:text-white"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <IconComponent className="text-base text-current flex-shrink-0" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        {/* <div>
          <Label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => value && handleSelectChange('status', value)}
          >
            <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-primary focus:border-primary rounded-lg h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>

      {/* Title */}
      <div className="mb-4">
        <Label htmlFor="title" className="block text-sm font-medium mb-2">
          Title *
        </Label>
        <Input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="e.g., Eiffel Tower Visit"
          required
        />
      </div>

      {/* Location */}
      <div className="mb-4">
        <Label htmlFor="location" className="block text-sm font-medium mb-2">
          Location
        </Label>
        <Input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="e.g., Paris, France"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Scheduled Time */}
        <div>
          <Label htmlFor="scheduled_time" className="block text-sm font-medium mb-2">
            Time
          </Label>
          <Input
            type="time"
            id="scheduled_time"
            name="scheduled_time"
            value={formData.scheduled_time}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Image URL */}
      <div className="mb-4">
        <Label htmlFor="image_url" className="block text-sm font-medium mb-2">
          Image URL
        </Label>
        <Input
          type="url"
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleInputChange}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Notes */}
      <div className="mb-6">
        <Label htmlFor="notes" className="block text-sm font-medium mb-2">
          Notes
        </Label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Add any additional notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg"
        >
          {loading ? 'Adding...' : 'Add Activity'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}