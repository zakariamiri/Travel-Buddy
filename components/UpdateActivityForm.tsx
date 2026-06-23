'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconType } from 'react-icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiUrl } from '@/lib/api'
import { Activity, ACTIVITY_TYPES } from '@/types/types'
import { createClient } from '@/utils/supabase/client'
import { FaCompass } from 'react-icons/fa'
import { toast } from 'sonner'
import { useTripContext } from './TripProvider'

interface UpdateActivityFormProps {
  tripId: string | string[]
  activity: Activity
  onSuccess?: () => void
  onCancel?: () => void
}

export default function UpdateActivityForm({
  tripId,
  activity,
  onSuccess,
  onCancel,
}: UpdateActivityFormProps) {
  const { tripDetails } = useTripContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const memberCount = Math.max(1, tripDetails?.membersCount ?? 1)

  const [formData, setFormData] = useState(() => ({
  type: activity.type || 'activity',
  title: activity.title || '',
  location: activity.location || '',
  notes: activity.notes || '',
  image_url: activity.image_url || '',
  scheduled_date: activity.scheduled_date
    ? new Date(activity.scheduled_date).toISOString().split('T')[0]
    : '',
  scheduled_time: activity.scheduled_time || '',
  price_per_person: activity.price_per_person?.toString() || '',
}))

  const estimatedTotal = (Number(formData.price_per_person) || 0) * memberCount

  useEffect(() => {
    const getToken = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentToken(session?.access_token || null)
    }
    getToken()
  }, [])

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const uploadImage = async (file: File) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const fileName = `activities/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error: uploadError } = await supabase.storage
        .from('trip-covers')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('trip-covers')
        .getPublicUrl(fileName)

      setFormData((current) => ({ ...current, image_url: data.publicUrl }))
      toast.success('Image uploaded')
    } catch (uploadError) {
      console.error('Activity image upload error:', uploadError)
      toast.error('Failed to upload image')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.title.trim() || !formData.scheduled_date) {
      setError('Title and scheduled date are required')
      return
    }
    if (!currentToken) {
      setError('Authentication session is not ready')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(apiUrl(`/api/trips/${tripId}/activities/${activity.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title.trim(),
          location: formData.location || null,
          notes: formData.notes || null,
          image_url: formData.image_url || null,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time || null,
          price_per_person: formData.price_per_person
            ? Number(formData.price_per_person)
            : 0,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update activity')
      }

      toast.success('Activity updated successfully')
      onSuccess?.()
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'An error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const selectedActivityType = ACTIVITY_TYPES.find(
    (type) => type.value === formData.type,
  )
const SelectedIcon = (selectedActivityType?.icon || FaCompass) as IconType;
  const categories = [...new Set(ACTIVITY_TYPES.map((type) => type.category))]

  return (
    <form 
      onSubmit={handleSubmit} 
      className="w-full"
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-x-5 gap-y-3 md:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              value && setFormData((current) => ({ ...current, type: value }))
            }
          >
            <SelectTrigger className="h-10 w-full border-[#e6d6c9] bg-white">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <SelectedIcon className="text-primary" />

                  
                  <span>{selectedActivityType?.label || 'Select type'}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {categories.map((category) => (
                <div key={category}>
                  <div className="sticky top-0 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-500">
                    {category}
                  </div>
                  {ACTIVITY_TYPES.filter((type) => type.category === category).map(
                    (type) => {
                      const Icon = (type.icon) as IconType
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <Icon />
                            {type.label}
                          </span>
                        </SelectItem>
                      )
                    },
                  )}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Field label="Title *">
          <Input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Eiffel Tower Visit"
            required
          />
        </Field>

        <Field label="Location">
          <Input
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Paris, France"
          />
        </Field>

        <Field label="Date *">
          <Input
            type="date"
            name="scheduled_date"
            value={formData.scheduled_date}
            min={tripDetails?.start_date?.split('T')[0]}
            max={tripDetails?.end_date?.split('T')[0]}
            onChange={handleInputChange}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Time">
            <Input
              type="time"
              name="scheduled_time"
              value={formData.scheduled_time}
              onChange={handleInputChange}
            />
          </Field>
          <Field label="Price/person">
            <Input
              type="number"
              name="price_per_person"
              min="0"
              value={formData.price_per_person}
              onChange={handleInputChange}
              placeholder="300"
            />
          </Field>
        </div>

        <div className="flex items-center rounded-lg border border-[#ecd2bd] bg-[#fff6ef] px-3 py-2 text-sm text-[#7f2a07]">
          <span className="font-semibold">Total estime:</span>
          <span className="ml-1">{estimatedTotal.toLocaleString('fr-MA')} DH</span>
          <span className="ml-1 text-[#a35e3d]">({memberCount} members)</span>
        </div>

        <Field label="Activity image">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="Direct image URL"
            />
            <Input
              type="file"
              accept="image/*"
              disabled={loading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) uploadImage(file)
              }}
            />
          </div>
        </Field>

        <div className="md:col-span-2">
          <Label className="mb-1.5 block">Notes</Label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add any additional notes..."
            rows={2}
            className="min-h-20 w-full rounded-lg border border-[#e6d6c9] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-[#f0dfd2] pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="min-w-36 bg-primary font-semibold text-white hover:bg-[#7f2a07]"
        >
          {loading ? 'Updating...' : 'Update Activity'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  )
}
