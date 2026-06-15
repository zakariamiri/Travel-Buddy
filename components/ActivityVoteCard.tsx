'use client'
import { Activity } from '@/types/types'
import { ACTIVITY_TYPES } from '@/types/types'
import { CiLocationOn } from "react-icons/ci"
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { useState } from 'react'
import { useTripContext } from './TripProvider'
import { toast } from 'sonner'
import { FaThumbsUp,FaThumbsDown  } from "react-icons/fa";
import { FaCompass } from 'react-icons/fa'
import { apiUrl } from '@/lib/api'

export default function ActivityVoteCard({ activity, tripId,membersCount,onSuccess }: { activity?: Activity | null; tripId: string; membersCount: number; onSuccess: () => void }) {
    
    const { currentToken } = useTripContext()
    const [isVoting, setIsVoting] = useState(false)
    const [imageFailed, setImageFailed] = useState(false)
    
    // Use local state for optimistic UI updates
    const [votes, setVotes] = useState(() => activity?.voteCount ?? 0)
    const [userVote, setUserVote] = useState(() => activity?.currentUserVote ?? 0)

    const handleVote = async (voteValue: number) => {
        if (!activity?.id) return
        if (!currentToken) {
            toast.error('You must be logged in to vote.')
            return
        }

        setIsVoting(true)
        const previousVote = userVote
        const previousVotes = votes
        setUserVote(voteValue)
        if (previousVote === 0) {
            setVotes((current) => current + 1)
        }
        
        try {
            const res = await fetch(apiUrl(`/api/trips/${tripId}/activities/${activity.id}/vote`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ vote_value: voteValue })
            });

            if (!res.ok) throw new Error('Failed to submit vote');
            toast.success('Vote recorded!');
            onSuccess()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error recording vote.';
            toast.error(errorMessage);
            setUserVote(previousVote)
            setVotes(previousVotes)
        } finally {
            setIsVoting(false)
        }
    }

    if (!activity) return null

    const safeMembersCount = Math.max(1, membersCount)
    const progressValue = Math.min(100, (votes / safeMembersCount) * 100)
    const ActivityIcon =
        ACTIVITY_TYPES.find((type) => type.value === activity.type)?.icon ||
        FaCompass
    const statusStyles = {
        approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        rejected: 'bg-red-50 text-red-700 ring-red-200',
        pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    }

    return (
        <div className='group relative flex min-h-[350px] flex-col overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-[0_7px_22px_rgba(127,42,7,0.1)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d8aa86] hover:shadow-[0_15px_32px_rgba(127,42,7,0.18)]'>
            <div className='relative'>
                 <div className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 shadow-sm ${statusStyles[activity.status]}`}>
                    {activity.status}
                 </div>
                {activity.image_url && !imageFailed ? (
                    <img
                        src={activity.image_url}
                        alt={activity.title}
                        onError={() => setImageFailed(true)}
                        className='h-36 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'
                    />
                ) : (
                    <div className='flex h-36 w-full items-center justify-center bg-[#f7e7dc] text-[#b2471d]'>
                        <ActivityIcon className='size-10 opacity-70' />
                    </div>
                )}
                <div className='absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent' />
                <div className='absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-lg bg-white/90 text-primary shadow-sm backdrop-blur'>
                    <ActivityIcon className='size-4' />
                </div>
            </div>
            <div className='flex flex-1 flex-col p-4'>
                <h2 className='line-clamp-1 text-base font-bold text-foreground'>{activity.title}</h2>
                <p className='mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
                    <CiLocationOn className='shrink-0 text-base' />
                    <span className='truncate'>{activity.location || 'No location'}</span>
                </p>

                <div className='my-3 rounded-lg border border-[#f0dfd2] bg-[#fff9f4] p-3'>
                    <div className='mb-2 flex items-center justify-between gap-2'>
                        <p className='text-xs font-semibold text-foreground'>Voting progress</p>
                        <p className='text-xs font-bold text-primary'>{votes}/{safeMembersCount}</p>
                    </div>
                    <Progress value={progressValue} className='w-full' />
                </div>
                
                <div className="mt-auto flex gap-2">
                    <Button 
                        variant={userVote === 1 ? "success" : "outline"} 
                        className={`h-9 flex-1 font-bold ${userVote === 1 ? '' : 'hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        disabled={isVoting}
                        onClick={() => handleVote(1)}
                    >
                        <FaThumbsUp className="size-3.5" />
                        <span className='text-xs'>Yes</span>
                    </Button>
                    <Button 
                        variant={userVote === -1 ? "destructive" : "outline"} 
                        className="h-9 flex-1 font-bold hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        disabled={isVoting}
                        onClick={() => handleVote(-1)}
                    >
                        <FaThumbsDown className="size-3.5" />
                        <span className='text-xs'>No</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
