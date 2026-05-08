import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export default function DayColumn({ id, title, subtitle, children, modalTrigger }: { id: string; title: string; subtitle: string; children: React.ReactNode; modalTrigger: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    const style = {
        backgroundColor: isOver ? '#f3f4f6' : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className='shrink-0 w-80 rounded-lg p-4 transition-colors '>
            <h2 className='font-semibold mb-3 text-sm text-gray-700'>
                {title}
                <span className='mx-5'>{subtitle}</span>
            </h2>

            {/* Display activities for this day */}
            <div className='space-y-2 mb-3'>
                {children}
            </div>

            {/* Add Activity Button for this day */}
            {modalTrigger}
        </div>
    );
}