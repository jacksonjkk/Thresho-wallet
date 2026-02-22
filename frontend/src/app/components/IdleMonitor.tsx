import { useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

/**
 * Monitors user activity and automatically logs out after a period of inactivity.
 * Standard security practice for financial/wallet applications.
 */
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export function IdleMonitor() {
    const { logout, user } = useAuth();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (user) {
            timeoutRef.current = setTimeout(() => {
                handleAutoLogout();
            }, IDLE_TIMEOUT);
        }
    };

    const handleAutoLogout = () => {
        toast.info("Session expired after 10 minutes of inactivity", {
            description: "Please login again to continue.",
            duration: 5000,
        });
        logout();
    };

    useEffect(() => {
        if (!user) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
        }

        // List of events that reset the idle timer
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click'
        ];

        // Initialize timer
        resetTimer();

        // Attach event listeners
        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [user]);

    return null;
}
