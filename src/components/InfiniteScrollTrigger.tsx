"use client";

import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
    onIntersect: () => void;
    isLoading: boolean;
    hasMore: boolean;
}

export default function InfiniteScrollTrigger({ onIntersect, isLoading, hasMore }: InfiniteScrollTriggerProps) {
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onIntersect();
                }
            },
            { threshold: 0.1 } // Trigger when 10% visible
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [onIntersect, hasMore, isLoading]);

    if (!hasMore) return null;

    return (
        <div ref={observerTarget} className="flex justify-center p-4 h-10">
            {isLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>}
        </div>
    );
}
