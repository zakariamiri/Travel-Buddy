import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export default function DayColumn({ id, title, subtitle, children, modalTrigger }: { id: string; title: string; subtitle: string; children: React.ReactNode; modalTrigger: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[420px] w-80 shrink-0 rounded-lg border bg-white p-4 shadow-[0_10px_28px_rgba(127,42,7,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(127,42,7,0.17)] ${isOver ? 'border-primary bg-sidebar/60 shadow-[0_16px_36px_rgba(127,42,7,0.2)]' : 'border-border'}`}
        >
            <div className='mb-4 flex items-center justify-between gap-3 border-b pb-3'>
                <div>
                    <h2 className='text-base font-bold text-foreground'>{title}</h2>
                    <p className='text-sm text-muted-foreground'>{subtitle}</p>
                </div>
                <span className='rounded-full bg-sidebar px-2.5 py-1 text-xs font-bold text-primary'>
                    Drop
                </span>
            </div>

            {/* Display activities for this day */}
            <div className='space-y-2 mb-3'>
                {children}
            </div>

            {/* Add Activity Button for this day */}
            {modalTrigger}
        </div>
    );
}
