'use client'
import { Activity } from '@/types/types'
import { CiLocationOn } from "react-icons/ci"
import { Skeleton } from './ui/skeleton'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { useTripContext } from './TripProvider'
import { toast } from 'sonner'
import { FaThumbsUp,FaThumbsDown  } from "react-icons/fa";
import { apiUrl } from '@/lib/api'

export default function ActivityVoteCard({ activity, tripId,membersCount }: { activity?: Activity | null; tripId: string; membersCount: number }) {
    const { currentToken } = useTripContext()
    const [isVoting, setIsVoting] = useState(false)
    
    // Use local state for optimistic UI updates
    const [votes, setVotes] = useState(() => activity?.voteCount ?? 0)
    const [userVote, setUserVote] = useState(() => activity?.currentUserVote ?? 0)

    useEffect(() => {
        setVotes(activity?.voteCount ?? 0)
        setUserVote(activity?.currentUserVote ?? 0)
    }, [activity?.id, activity?.voteCount, activity?.currentUserVote])

    const handleVote = async (voteValue: number) => {
        if (!activity?.id) return
        if (!currentToken) {
            toast.error('You must be logged in to vote.')
            return
        }

        setIsVoting(true)
        const previousVote = userVote
        setUserVote(voteValue)
        
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
        } catch (error) {
            toast.error('Error recording vote.');
            setUserVote(previousVote) // Revert on fail
        } finally {
            setIsVoting(false)
        }
    }

    if (!activity) return null

    const safeMembersCount = Math.max(1, membersCount)
    const progressValue = Math.min(100, (votes / safeMembersCount) * 100)

    return (
        <div className='relative overflow-hidden rounded-lg border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md'>
            <div className='relative'>
                 <div className='absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm'>
                    {activity.status}
                 </div>
                {activity.image_url ? <img src={activity.image_url} alt={activity.title} className='h-44 w-full object-cover' /> : <Skeleton className='h-44 w-full' />}
            </div>
            <div className='p-5'>
                <h2 className='line-clamp-1 text-xl font-bold text-foreground'>{activity.title}</h2>
                <p className='mt-1 flex items-center gap-2 text-sm text-muted-foreground'><CiLocationOn /> {activity.location || 'No location'}</p>

                <div className='my-4 rounded-lg bg-sidebar/50 p-3'>
                    <div className='mb-2 flex items-center justify-between'>
                        <p className='text-sm font-semibold text-foreground'>Voting progress</p>
                        <p className='text-sm font-bold text-primary'>{votes}/{safeMembersCount}</p>
                    </div>
                    <Progress value={progressValue} className='w-full' />
                </div>
                
                <div className="flex gap-3 mt-4">
                    <Button 
                        variant={userVote === 1 ? "success" : "outline"} 
                        className={`h-10 flex-1 font-bold ${userVote === 1 ? '' : 'hover:bg-secondary/10 hover:text-secondary'}`}
                        disabled={isVoting}
                        onClick={() => handleVote(1)}
                    >
                        <FaThumbsUp className="w-4 h-4 mr-2" />
                    </Button>
                    <Button 
                        variant={userVote === -1 ? "destructive" : "outline"} 
                        className="h-10 flex-1 font-bold"
                        disabled={isVoting}
                        onClick={() => handleVote(-1)}
                    >
                        <FaThumbsDown className="w-4 h-4 mr-2" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
