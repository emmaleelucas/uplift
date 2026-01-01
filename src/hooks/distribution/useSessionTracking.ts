"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Coordinates, DistributionSession } from "@/types/distribution";
import {
    startDistributionSession,
    endDistributionSession,
    updateSessionCurrentStop,
    recordVanLocation,
} from "@/db/actions";

const LOCATION_RECORD_INTERVAL = 30000; // 30 seconds

interface UseSessionTrackingProps {
    currentLocation: Coordinates | null;
    routeId: string | null;
    currentStopId: string | null;
    isActive: boolean; // Whether volunteer is actively distributing
}

export function useSessionTracking({
    currentLocation,
    routeId,
    currentStopId,
    isActive,
}: UseSessionTrackingProps) {
    const [session, setSession] = useState<DistributionSession | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastRecordedRef = useRef<{ lat: number; lng: number } | null>(null);

    // Start a new session when volunteer begins distributing
    const startSession = useCallback(async (rId: string) => {
        if (isStarting || session) return;

        setIsStarting(true);
        const sessionId = await startDistributionSession(rId);

        if (sessionId) {
            setSession({
                id: sessionId,
                routeId: rId,
                startedAt: new Date().toISOString(),
                endedAt: null,
                currentStopId: null,
                isActive: true,
            });
        }
        setIsStarting(false);
    }, [isStarting, session]);

    // End the current session
    const endSession = useCallback(async () => {
        if (!session) return;

        await endDistributionSession(session.id);
        setSession(null);
        lastRecordedRef.current = null;
    }, [session]);

    // Record current location
    const recordLocation = useCallback(async () => {
        if (!session || !currentLocation) return;

        // Skip if location hasn't changed significantly (within ~10 meters)
        if (lastRecordedRef.current) {
            const latDiff = Math.abs(currentLocation.lat - lastRecordedRef.current.lat);
            const lngDiff = Math.abs(currentLocation.lng - lastRecordedRef.current.lng);
            if (latDiff < 0.0001 && lngDiff < 0.0001) return;
        }

        await recordVanLocation(session.id, currentLocation.lat, currentLocation.lng);
        lastRecordedRef.current = { lat: currentLocation.lat, lng: currentLocation.lng };
    }, [session, currentLocation]);

    // Start session when route is confirmed and volunteer becomes active
    useEffect(() => {
        if (isActive && routeId && !session && !isStarting) {
            startSession(routeId);
        }
    }, [isActive, routeId, session, isStarting, startSession]);

    // End session when volunteer stops distributing
    useEffect(() => {
        if (!isActive && session) {
            endSession();
        }
    }, [isActive, session, endSession]);

    // Update current stop on session when it changes
    useEffect(() => {
        if (session && currentStopId !== session.currentStopId) {
            updateSessionCurrentStop(session.id, currentStopId);
            setSession(prev => prev ? { ...prev, currentStopId } : null);
        }
    }, [session, currentStopId]);

    // Record location periodically while session is active
    useEffect(() => {
        if (!session || !isActive) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Record immediately when session starts
        recordLocation();

        // Then record periodically
        intervalRef.current = setInterval(recordLocation, LOCATION_RECORD_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [session, isActive, recordLocation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        session,
        isStarting,
        startSession,
        endSession,
    };
}
