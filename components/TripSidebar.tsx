'use client'

import { useEffect, useState } from 'react';
import Image from 'next/image';
import logo from '../public/logo2.png';
import logoIcon from '../public/logoWhite.png'; // swap with your icon-only logo if you have one
import { CiCalendar } from "react-icons/ci";
import avatar from '../public/avatar1.jpg';
import md5 from "md5";
import { MdOutlineTimeline } from "react-icons/md";
import { RiMoneyDollarBoxLine } from "react-icons/ri";
import { MdHowToVote } from "react-icons/md";
import Trip from '@/types/types';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarTrigger,
    useSidebar
} from './ui/sidebar';
import { TooltipProvider } from './ui/tooltip';
import Link from 'next/link';

export default function TripSidebar({ tripDetails }: { tripDetails: Trip | null }) {
    const { state } = useSidebar();
    const pathname = usePathname();
    const isCollapsed = state === 'collapsed';
    const supabase = createClient();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserAvatar, setCurrentUserAvatar] = useState<string>("");

    useEffect(() => {
        const getCurrentUserAvatar = async () => {
            const { data } = await supabase.auth.getUser();
            const user = data.user;
            if (!user) return;

            const email = user.email || "";
            const hash = md5(email.trim().toLowerCase());
            const avatarUrl =
                user.user_metadata?.avatar_url ||
                `https://www.gravatar.com/avatar/${hash}?d=identicon`;

            setCurrentUserId(user.id);
            setCurrentUserAvatar(avatarUrl);
        };

        getCurrentUserAvatar();
    }, [supabase.auth]);

    const items = [
        { name: "Timeline", Icon: MdOutlineTimeline, link: `/dashboard/${tripDetails?.id}` },
        { name: "Votes", Icon: MdHowToVote, link: `/dashboard/${tripDetails?.id}/votes` },
        { name: "Budget", Icon: RiMoneyDollarBoxLine, link: `/dashboard/${tripDetails?.id}/budget` },
    ];

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

    const start_month = new Date(tripDetails.start_date || "").toLocaleString('default', { month: 'short' });
    const end_month = new Date(tripDetails.end_date || "").toLocaleString('default', { month: 'short' });
    const start_day = new Date(tripDetails.start_date || "").getDate();
    const end_day = new Date(tripDetails.end_date || "").getDate();
    const date = start_month === end_month
        ? `${start_month} ${start_day}-${end_day}`
        : `${start_month} ${start_day} - ${end_month} ${end_day}`;

    return (
        <Sidebar collapsible="icon" className="bg-sidebar border-r border-[#ead9bf]">

            {/* Header: Logo + Toggle */}
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

                {/* Trip Cover Card — hidden when collapsed */}
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
                                        {tripDetails.membersCount || 0} members
                                    </span>
                                </div>
                            </div>
                        </div>
                    </SidebarGroup>
                )}

                {/* Members — hidden when collapsed */}
                {!isCollapsed && (
                    <SidebarGroup className="px-3">
                        <div className="rounded-lg border border-[#ead9bf] bg-white p-3 shadow-sm">
                        <div className='mb-3 flex items-center justify-between'>
                            <div>
                                <p className='text-xs font-bold uppercase tracking-wide text-gray-600'>Members</p>
                                <p className="text-xs text-gray-500">Trip participants</p>
                            </div>
                            <span className="rounded-full bg-[#f3e4da] px-2.5 py-1 text-xs font-bold text-[#9f411d]">
                                {tripDetails.members?.length || tripDetails.membersCount || 0}
                            </span>
                        </div>
                        <div className='space-y-2'>
                            {(tripDetails.members?.length ? tripDetails.members : [1, 2, 3]).slice(0, 4).map((member, index) => {
                                const isMemberObject = typeof member === 'object';
                                const memberName = isMemberObject ? member.full_name || member.email || `Member ${index + 1}` : `Member ${index + 1}`;
                                const role = isMemberObject ? member.role : undefined;
                                const isCurrentUser = isMemberObject && member.id === currentUserId;
                                const avatarSrc = isCurrentUser && currentUserAvatar
                                    ? currentUserAvatar
                                    : isMemberObject && member.avatar_url
                                      ? member.avatar_url
                                      : avatar;

                                return (
                                    <div key={isMemberObject ? member.id || index : index} className="flex items-center gap-2 rounded-lg bg-[#fff8ec] p-2">
                                        <div className="relative">
                                            <Image
                                                src={avatarSrc}
                                                alt={memberName}
                                                className="size-9 rounded-full object-cover ring-2 ring-white"
                                                width={36}
                                                height={36}
                                                unoptimized={typeof avatarSrc === 'string' && avatarSrc.startsWith('http')}
                                            />
                                            {role === 'owner' && (
                                                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] text-[#7f2a07]">
                                                    <i className="ri-vip-crown-fill" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-gray-800">{memberName}</p>
                                            <p className="text-xs font-medium text-gray-500">{role === 'owner' ? 'Admin' : 'Member'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {(tripDetails.members?.length || 0) > 4 && (
                                <p className="pt-1 text-xs font-semibold text-primary">
                                    +{(tripDetails.members?.length || 0) - 4} more
                                </p>
                            )}
                        </div>
                        </div>
                    </SidebarGroup>
                )}

                {/* Nav Items */}
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
    );
}
