"use client";

import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
    onIntersect: () => void;
    isLoading: boolean;
    hasMore: boolean;
}

export default function InfiniteScrollTrigger({ onIntersect, isLoading, hasMore }: InfiniteScrollTriggerProps) {
    const observerTarget = useRef<HTMLDivElement>(null);
    const onIntersectRef = useRef(onIntersect);
    const hasMoreRef = useRef(hasMore);
    const isLoadingRef = useRef(isLoading);

    useEffect(() => { onIntersectRef.current = onIntersect; }, [onIntersect]);
    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
    useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
                    onIntersectRef.current();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, []);

    if (!hasMore) return null;

    return (
        <div ref={observerTarget} className="flex justify-center p-4 h-10">
            {isLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>}
        </div>
    );
}
