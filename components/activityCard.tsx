
import React from 'react'
import { Card, CardContent } from './ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { FiMoreHorizontal } from "react-icons/fi"
import { CiTrash, CiLocationOn } from "react-icons/ci"
import { ACTIVITY_TYPES } from '@/types/types'
import { FaCompass } from 'react-icons/fa'
import { useDraggable } from '@dnd-kit/core';

export default function ActivityCard({ activity, onDelete }: { activity: any; onDelete: () => void }) {
  const scheduledTime = (activity.scheduled_time || '').slice(0, 5)

  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: activity.id,
    data: { activity }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;



  // Create a map of activity type values to icons for quick lookup
  const typeToIcon = ACTIVITY_TYPES.reduce(
    (acc, type) => {
      acc[type.value] = type.icon
      return acc
    },
    {} as Record<string, React.ElementType>
  )

  const type = activity.type?.toLowerCase() || 'activity'
  const Icon = typeToIcon[type] || FaCompass

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className='w-full cursor-move z-50'  >
      <CardContent>
        <div className='flex flex-row gap-4 items-start'>
          {/* Activity icon */}
          <div className='w-8 h-8 bg-white border border-gray-300 rounded-lg flex-shrink-0 mt-4 items-center justify-center flex text-primary'>
            <Icon className="text-xl" />
          </div>

          {/* Activity info */}
          <div className='flex-1'>
            <p className='text-primary font-bold text-lg'>{scheduledTime}</p>
            <p className='font-semibold text-gray-900'>{activity.title}</p>
            <p className='flex items-center gap-2 text-gray-600 text-sm'>
              <CiLocationOn /> {activity.location}
            </p>
          </div>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className='h-8 w-8 p-0 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0'>
              <FiMoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                onClick={onDelete}
                className='text-red-600 cursor-pointer hover:text-red-700 focus:text-red-700 focus:bg-red-50'
              >
                <CiTrash className='mr-2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}