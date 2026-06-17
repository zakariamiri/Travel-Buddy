import React from 'react'
import { Card, CardContent } from './ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { FiMoreHorizontal } from "react-icons/fi"
import { CiTrash, CiLocationOn } from "react-icons/ci"
import { Activity, ACTIVITY_TYPES } from '@/types/types'
import { FaCompass } from 'react-icons/fa'
import { useDraggable } from '@dnd-kit/core';
import {

  Pencil

} from "lucide-react";
import UpdateActivityModal from './UpdateActivityModal';
import { useTripContext } from './TripProvider';
import { IconType } from 'react-icons'

export default function ActivityCard({ activity, onDelete, canEdit = false }: { activity: Activity; onDelete: () => void; canEdit?: boolean }) {
  const scheduledTime = (activity.scheduled_time || '').slice(0, 5)
  const { tripDetails } = useTripContext();


  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: activity.id,
    data: { activity },
    disabled: !canEdit,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;


  // Create a map of activity type values to icons for quick lookup
  const typeToIcon = ACTIVITY_TYPES.reduce<Record<string, React.ElementType>>(
    (acc, type) => {
      acc[type.value] = type.icon
      return acc
    },
    {}
  )

  const type = activity.type?.toLowerCase() || 'activity'
  const Icon = (typeToIcon[type] || FaCompass) as IconType

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...(canEdit ? attributes : {})}
      {...(canEdit ? listeners : {})}
      className={`z-50 w-full rounded-lg border bg-white py-4 shadow-[0_5px_16px_rgba(127,42,7,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(127,42,7,0.2)] ${canEdit ? 'cursor-move' : ''}`}
    >
      <CardContent className='px-4'>
        <div className='flex flex-row gap-4 items-start'>
          {/* Activity icon */}
          <div className='mt-1 flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <Icon className="text-lg" />
          </div>

          {/* Activity info */}
          <div className='flex-1'>
            <p className='text-sm font-bold text-primary'>{scheduledTime || 'All day'}</p>
            <p className='line-clamp-1 font-semibold text-gray-900'>{activity.title}</p>
            <p className='mt-1 flex items-center gap-2 text-sm text-gray-600'>
              <CiLocationOn /> {activity.location || 'No location'}
            </p>
          </div>

          {/* Menu */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger className='h-8 w-8 p-0 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0'>
                <FiMoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className='text-red-600 cursor-pointer hover:text-red-700 focus:text-red-700 focus:bg-red-50'
                >
                  <CiTrash className='mr-2' />
                  Delete
                </DropdownMenuItem>
                <UpdateActivityModal
                  tripId={tripDetails?.id || ''}
                  activity={activity}
                >
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className='text-gray-700 cursor-pointer hover:text-[#7f2a07] focus:text-gray-900 focus:bg-gray-50 w'
                  >
                    
                    <Pencil className='mr-2' size={16} />
                    Update
                  </DropdownMenuItem>

                </UpdateActivityModal>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
