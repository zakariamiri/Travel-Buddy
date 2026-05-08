'use client'

import Image from 'next/image';
import logo from '../public/logo2.png';
import logoIcon from '../public/logoWhite.png'; // swap with your icon-only logo if you have one
import { CiCalendar } from "react-icons/ci";
import avatar from '../public/avatar1.jpg';
import { MdOutlineTimeline } from "react-icons/md";
import { RiMoneyDollarBoxLine } from "react-icons/ri";
import { MdHowToVote } from "react-icons/md";
import Trip from '@/types/types';
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

export default function TripSidebar({ tripDetails }: { tripDetails: Trip | null }) {
    const { state, toggleSidebar } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const items = [
        { name: "Timeline", icon: <MdOutlineTimeline /> },
        { name: "Budget", icon: <RiMoneyDollarBoxLine /> },
        { name: "Votes", icon: <MdHowToVote /> },
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
        <Sidebar collapsible="icon" className="bg-sidebar border-r">

            {/* Header: Logo + Toggle */}
            <SidebarHeader className="flex flex-col items-center py-4 gap-2">
                {isCollapsed ? (
                    <Image
                        src={logoIcon}
                        alt="Logo"
                        width={100}
                        height={100}
                        className="cursor-pointer"
                        onClick={toggleSidebar}
                    />
                ) : (
                    <div className="flex flex-row items-center justify-between gap-2">
                        <Image
                            src={logo}
                            alt="Logo"
                            width={140}
                            height={140}
                        />
                        <SidebarTrigger className="text-primary" />
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent className="flex flex-col">

                {/* Trip Cover Card — hidden when collapsed */}
                {!isCollapsed && (
                    <SidebarGroup>
                        <div className='relative overflow-hidden rounded-lg mx-3'>
                            <Image
                                src={tripDetails.cover_url}
                                alt={tripDetails.name}
                                width={320}
                                height={200}
                                className='w-full h-auto'
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className='flex flex-row absolute bottom-3 left-4 text-white gap-2 items-center'>
                                <div className='flex flex-col'>
                                    <h2 className='text-sm font-semibold'>{tripDetails.name}</h2>
                                    <span className='bg-primary rounded-full px-2 py-1 text-xs flex items-center gap-1 mt-1'>
                                        <CiCalendar className='text-sm' />
                                        {date}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </SidebarGroup>
                )}

                {/* Members — hidden when collapsed */}
                {!isCollapsed && (
                    <SidebarGroup className="px-3">
                        <div className='flex justify-between items-center mb-3'>
                            <p className='text-sm font-medium'>Members</p>
                            <span className='text-primary hover:underline cursor-pointer font-bold text-sm'>+ Invite</span>
                        </div>
                        <div className='flex gap-2'>
                            {[1, 2, 3, 4].map((index) => (
                                <Image
                                    key={index}
                                    src={avatar}
                                    alt={`Avatar ${index}`}
                                    className="rounded-full object-cover w-9 h-9"
                                />
                            ))}
                        </div>
                    </SidebarGroup>
                )}

                {/* Nav Items */}
                <SidebarGroup className={`${isCollapsed ? 'flex items-center' : ''} p-0`}>
                    <TooltipProvider>
                        <ul className='space-y-1 w-full'>
                            {items.map((item) => (
                                <li key={item.name} className='w-full'>
                                    <Tooltip>
                                        <TooltipTrigger className='w-full px-3'>
                                            <div className={`flex items-center gap-3 py-2 rounded-lg hover:bg-[#9f411d] hover:text-white cursor-pointer transition-colors text-sm w-full
                                ${isCollapsed ? 'justify-center px-2  text-primary' : 'px-4'}`}>
                                                <span className='text-lg shrink-0'>{item.icon}</span>
                                                {!isCollapsed && <span>{item.name}</span>}
                                            </div>
                                        </TooltipTrigger>

                                    </Tooltip>
                                </li>
                            ))}
                        </ul>
                    </TooltipProvider>
                </SidebarGroup>

            </SidebarContent>

            <SidebarFooter />
        </Sidebar>
    );
}