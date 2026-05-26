'use client'

import Trip from '@/types/types';
import { apiUrl } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';
import { Crown } from 'lucide-react';
import md5 from 'md5';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CiCalendar } from "react-icons/ci";
import { MdHowToVote, MdOutlineTimeline } from "react-icons/md";
import { RiMoneyDollarBoxLine } from "react-icons/ri";
import { toast } from 'sonner';
import logo from '../public/logo2.png';
import logoIcon from '../public/logoWhite.png';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarTrigger,
    useSidebar
} from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type TripMember = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string | null;
    role: 'owner' | 'contributor' | 'viewer';
    joined_at: string | null;
};

function getInitials(member: TripMember) {
    const label = member.full_name || member.email || 'User';
    return label
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function getAvatarUrl(member: Pick<TripMember, 'avatar_url' | 'email'>) {
    if (member.avatar_url) return member.avatar_url;

    const email = member.email || '';
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

export default function TripSidebar({ tripDetails }: { tripDetails: Trip | null }) {
    const { state } = useSidebar();
    const pathname = usePathname();
    const isCollapsed = state === 'collapsed';
    const [members, setMembers] = useState<TripMember[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmails, setInviteEmails] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [inviteSending, setInviteSending] = useState(false);

    const items = [
        { name: "Timeline", Icon: MdOutlineTimeline, link: `/dashboard/${tripDetails?.id}` },
        { name: "Votes", Icon: MdHowToVote, link: `/dashboard/${tripDetails?.id}/votes` },
        { name: "Budget", Icon: RiMoneyDollarBoxLine, link: `/dashboard/${tripDetails?.id}/budget` },
    ];

    useEffect(() => {
        const initSession = async () => {
            const supabase = createClient();
            const [{ data: sessionData }, { data: userData }] = await Promise.all([
                supabase.auth.getSession(),
                supabase.auth.getUser(),
            ]);

            setToken(sessionData.session?.access_token || null);
            setCurrentUserId(userData.user?.id || null);
        };

        initSession();
    }, []);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!tripDetails?.id || !token) return;

            try {
                const res = await fetch(
                    apiUrl(`/api/trips/${tripDetails.id}/members`),
                    { headers: { Authorization: `Bearer ${token}` } },
                );

                if (!res.ok) return;

                const text = await res.text();
                const data = text ? JSON.parse(text) : [];
                setMembers(Array.isArray(data) ? data : []);
                console.log('Fetched members:', data);
            } catch (err) {
                console.error('Error fetching trip members:', err);
            }
        };

        fetchMembers();
    }, [tripDetails?.id, token]);

    if (!tripDetails) {
        return (
            <Sidebar collapsible="icon" className="bg-sidebar border-r">
                <SidebarHeader className="flex justify-center items-center py-4">
                    <Image src={logo} alt="Logo" width={isCollapsed ? 32 : 140} height={isCollapsed ? 32 : 140} className='rounded-lg transition-all duration-300' />
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        {!isCollapsed && <div className='mb-6 h-40 bg-gray-300 animate-pulse rounded-lg' />}
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        );
    }

    const startMonth = new Date(tripDetails.start_date || "").toLocaleString('default', { month: 'short' });
    const endMonth = new Date(tripDetails.end_date || "").toLocaleString('default', { month: 'short' });
    const startDay = new Date(tripDetails.start_date || "").getDate();
    const endDay = new Date(tripDetails.end_date || "").getDate();
    const date = startMonth === endMonth
        ? `${startMonth} ${startDay}-${endDay}`
        : `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    const owner = members.find((member) => member.role === 'owner');
    const contributors = members.filter((member) => member.role !== 'owner');
    const visibleMembers = [
        ...(owner ? [owner] : []),
        ...contributors,
    ].slice(0, 4);
    const extraMembers = Math.max(members.length - visibleMembers.length, 0);
    const isOwner = Boolean(owner && owner.id === currentUserId);

    const handleInviteSubmit = async () => {
        if (!tripDetails?.id || !token) return;

        setInviteError('');
        if (!inviteEmails.trim()) {
            setInviteError('Ajoute au moins une adresse email.');
            return;
        }

        setInviteSending(true);
        try {
            const res = await fetch('/api/send-trip-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tripId: tripDetails.id,
                    emails: inviteEmails,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Impossible d'envoyer l'invitation.");
            }

            toast.success('Invitation envoyee !');
            setInviteEmails('');
            setInviteOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur invitation.';
            setInviteError(message);
            toast.error(message);
        } finally {
            setInviteSending(false);
        }
    };

    return (
        <>
            <Sidebar collapsible="icon" className="bg-sidebar border-r border-[#ead9bf]">
                <SidebarHeader className="flex flex-col items-center border-b border-[#ead9bf] px-3 py-4">
                    {isCollapsed ? (
                        <div className="flex flex-col items-center gap-3">
                            <Link href="/dashboard" aria-label="Go to dashboard">
                                <Image
                                    src={logoIcon}
                                    alt="Logo"
                                    width={54}
                                    height={54}
                                    className="cursor-pointer"
                                />
                            </Link>
                            <SidebarTrigger className="size-9 rounded-lg bg-white text-primary shadow-sm hover:bg-[#9f411d] hover:text-white" />
                        </div>
                    ) : (
                        <div className="flex w-full flex-row items-center justify-between gap-2">
                            <Link href="/dashboard" aria-label="Go to dashboard">
                                <Image
                                    src={logo}
                                    alt="Logo"
                                    width={140}
                                    height={140}
                                    className="cursor-pointer"
                                />
                            </Link>
                            <SidebarTrigger className="text-primary" />
                        </div>
                    )}
                </SidebarHeader>

                <SidebarContent className="flex flex-col gap-3 py-4">
                    {!isCollapsed && (
                        <SidebarGroup className="px-3">
                            <div className='relative overflow-hidden rounded-lg border border-white/70 bg-white shadow-sm'>
                                <Image
                                    src={tripDetails.cover_url}
                                    alt={tripDetails.name}
                                    width={320}
                                    height={200}
                                    className='h-40 w-full object-cover'
                                    priority
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                                <div className='absolute bottom-3 left-3 right-3 flex flex-col gap-2 text-white'>
                                    <div className='min-w-0'>
                                        <h2 className='line-clamp-2 text-base font-bold leading-tight'>{tripDetails.name}</h2>
                                        <span className='mt-2 flex w-fit items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold shadow-sm'>
                                            <CiCalendar className='text-sm' />
                                            {date}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-primary">
                                            {tripDetails.destination}
                                        </span>
                                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-primary">
                                            {members.length || tripDetails.membersCount || 0} members
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </SidebarGroup>
                    )}

                    {!isCollapsed && (
                        <SidebarGroup className="px-3">
                            <div className="rounded-lg border border-[#ead9bf] bg-white p-3 shadow-sm">
                                <div className='mb-3 flex items-center justify-between'>
                                    <div>
                                        <p className='text-xs font-bold uppercase tracking-wide text-gray-600'>Members</p>
                                        <p className="text-xs text-gray-500">Trip participants</p>
                                    </div>
                                    {isOwner && (
                                        <button
                                            type="button"
                                            onClick={() => setInviteOpen(true)}
                                            className='text-primary hover:underline cursor-pointer font-bold text-sm'
                                        >
                                            + Invite
                                        </button>
                                    )}
                                </div>
                                <TooltipProvider>
                                    <div className='flex items-center -space-x-2'>
                                        {visibleMembers.map((member) => {
                                            const label = member.full_name || member.email || 'User';
                                            const memberIsOwner = member.role === 'owner';

                                            return (
                                                <Tooltip key={member.id}>
                                                    <TooltipTrigger>
                                                        <div className="relative">
                                                            {memberIsOwner && (
                                                                <Crown className="absolute -top-3 left-1/2 z-10 h-3 w-3 -translate-x-1/2 fill-yellow-400 text-yellow-500" />
                                                            )}
                                                            <Avatar
                                                                className={`h-9 w-9 ${
                                                                    memberIsOwner
                                                                        ? 'ring-2 ring-primary'
                                                                        : 'ring-2 ring-white'
                                                                }`}
                                                            >
                                                                <AvatarImage src={getAvatarUrl(member)} alt={label} />
                                                                <AvatarFallback className="bg-[#FFEEE0] text-xs font-semibold text-primary">
                                                                    {getInitials(member)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{label}</TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                        {extraMembers > 0 && (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white ring-2 ring-white">
                                                +{extraMembers}
                                            </div>
                                        )}
                                    </div>
                                </TooltipProvider>
                            </div>
                        </SidebarGroup>
                    )}

                    <SidebarGroup className={`${isCollapsed ? 'flex items-center' : ''} px-3`}>
                        <TooltipProvider>
                            {!isCollapsed && (
                                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                                    Navigation
                                </p>
                            )}
                            <ul className='w-full space-y-1'>
                                {items.map((item) => {
                                    const isActive = pathname === item.link;
                                    const Icon = item.Icon;

                                    return (
                                        <li key={item.name} className='w-full'>
                                            <Link
                                                href={item.link}
                                                className={`group flex w-full items-center gap-3 rounded-lg py-3 text-sm font-semibold transition-all
                                                ${isCollapsed ? 'justify-center px-2' : 'px-3'}
                                                ${isActive ? 'bg-[#9f411d] text-white shadow-sm' : 'text-gray-800 hover:bg-[#9f411d] hover:text-white'}`}
                                            >
                                                <Icon className={`size-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#9f411d] group-hover:text-white'}`} />
                                                {!isCollapsed && <span>{item.name}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </TooltipProvider>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter />
            </Sidebar>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            Inviter des membres
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 mt-2">
                        <div>
                            <Label htmlFor="invite-emails" className="text-sm font-medium text-gray-700">
                                Emails
                            </Label>
                            <Input
                                id="invite-emails"
                                placeholder="ami@email.com, autre@email.com"
                                value={inviteEmails}
                                onChange={(event) => setInviteEmails(event.target.value)}
                                disabled={inviteSending}
                                className="mt-1 p-5"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Separe plusieurs emails avec une virgule, un espace ou un point-virgule.
                            </p>
                        </div>

                        {inviteError && (
                            <p className="text-red-500 text-sm">{inviteError}</p>
                        )}

                        <Button
                            onClick={handleInviteSubmit}
                            disabled={inviteSending}
                            className="bg-[#9f411d] hover:bg-[#8a3412] text-white rounded-xl mt-2 py-5"
                        >
                            {inviteSending ? 'Envoi...' : 'Envoyer invitation'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
