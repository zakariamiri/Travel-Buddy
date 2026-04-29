import React from 'react'
import Image from 'next/image';
import image from '../public/amalfi_coast.png';
import logo from '../public/logo2.png';
import { CiCalendar } from "react-icons/ci";
import avatar from '../public/avatar1.jpg';
import { MdOutlineTimeline } from "react-icons/md";
import { RiMoneyDollarBoxLine } from "react-icons/ri";
import { MdHowToVote } from "react-icons/md";



export default function TripSidebar() {
    const items = [
        {name: "Timeline", icon: <MdOutlineTimeline />},
        {name: "Budget", icon: <RiMoneyDollarBoxLine />},
        {name: "Votes", icon: <MdHowToVote />},
    ]
    return (
        <aside className='w-80 bg-sidebar border-r flex flex-col p-2 h-screen sticky top-0 overflow-y-auto'>
            {/* Logo */}
            <div className='flex justify-center items-center mb-4'>
                <Image
                    src={logo}
                    alt="Logo"
                    width={140}
                    height={140}
                    className='rounded-lg'
                />
            </div>

            {/* Trip Card */}
            <div className='mb-6'>
                <div className='relative overflow-hidden'>
                    <Image
                        src={image}
                        alt="Amalfi coast"
                        className='w-full h-auto'
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className='flex flex-row absolute bottom-3 left-4 text-white gap-2 items-center'>
                        <div className='flex flex-col'>
                            <h2 className='text-sm font-semibold'>Amalfi Coast</h2>
                            <span className='bg-primary rounded-full px-2 py-1 text-xs flex items-center gap-1 mt-1'><CiCalendar className='text-sm' />
                                sept 12-18</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className='mb-6 px-3'>
                <div className='flex justify-between items-center mb-3'>
                    <p className='text-sm font-medium'>Members</p>
                    <h1 className='text-primary hover:underline cursor-pointer font-bold text-sm'>+ Invite</h1>
                </div>
                <div className='flex gap-2'>
                    <Image
                        src={avatar}
                        alt="Avatar 1"
                        className="rounded-full object-cover w-9 h-9"
                    />
                    <Image
                        src={avatar}
                        alt="Avatar 1"
                        className="rounded-full object-cover w-9 h-9"
                    />
                    <Image
                        src={avatar}
                        alt="Avatar 1"
                        className="rounded-full object-cover w-9 h-9"
                    />
                    <Image
                        src={avatar}
                        alt="Avatar 1"
                        className="rounded-full object-cover w-9 h-9"
                    />
                </div>
            </div>

            {/* Menu Items */}
            <ul className='space-y-1'>
                {items.map((item)=>{
                    return(
                        <li key={item.name} className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#9f411d] hover:text-white cursor-pointer transition-colors text-sm'>
                            <span className='text-lg'>{item.icon}</span>
                            {item.name}
                        </li>
                    )
                })}
            </ul>
        </aside>
    )
}