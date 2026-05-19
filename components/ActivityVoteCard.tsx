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
            const res = await fetch(`http://localhost:3001/api/trips/${tripId}/activities/${activity.id}/vote`, {
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

    return (
        <div className='bg-white rounded-lg shadow-md overflow-hidden relative border'>
            <div>
                 <div className='bg-primary-foreground opacity-90 text-primary font-bold p-1 rounded-sm absolute top-2 left-2 z-10' >Day 1</div>
                {activity.image_url ? <img src={activity.image_url} alt={activity.title} className='w-full h-40 object-cover rounded-lg' /> : <Skeleton className='w-full h-40' />}
            </div>
            <div className='p-5'>
                <h2 className='text-xl font-bold'>{activity.title}</h2>
                <p className='text-muted-foreground flex items-center gap-2 text-sm'><CiLocationOn /> {activity.location}</p>

                <div className='my-4 gap-2'>
                    {/* Assuming trip has 6 members total */}
                    <p className='text-sm font-bold text-primary flex flex-col items-end'>{votes}/{membersCount} voted</p>
                    <Progress value={(votes / membersCount) * 100} className='w-full h-2' />
                </div>
                
                <div className="flex gap-3 mt-4">
                    <Button 
                        variant={userVote === 1 ? "success" : "outline"} 
                        className="flex-1 w-full text-black font-bold" 
                        disabled={isVoting}
                        onClick={() => handleVote(1)}
                    >
                        <FaThumbsUp className="w-4 h-4 mr-2" />
                    </Button>
                    <Button 
                        variant={userVote === -1 ? "destructive" : "outline"} 
                        className="flex-1 w-full" 
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