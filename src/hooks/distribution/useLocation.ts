"use client";

import { useState, useEffect } from "react";
import { Coordinates } from "@/types/distribution";
import { USE_MOCK_LOCATION, MOCK_LOCATION_SEQUENCE } from "@/lib/constants/routes";

export function useLocation() {
    const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);

    useEffect(() => {
        // If mocking, simulate location sequence with delays
        if (USE_MOCK_LOCATION) {
            const timeouts: NodeJS.Timeout[] = [];

            MOCK_LOCATION_SEQUENCE.forEach((loc, index) => {
                const timeout = setTimeout(() => {
                    setCurrentLocation({ lat: loc.lat, lng: loc.lng });
                    console.log(`[Mock Location ${index + 1}/${MOCK_LOCATION_SEQUENCE.length}] Set to: (${loc.lat}, ${loc.lng})`);
                }, loc.delay);
                timeouts.push(timeout);
            });

            // Cleanup timeouts on unmount
            return () => {
                timeouts.forEach(t => clearTimeout(t));
            };
        }

        if (!navigator.geolocation) return;

        // Use watchPosition for continuous tracking as user moves
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (error) => {
                console.log('GPS error:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000 // Accept cached position up to 5 seconds old
            }
        );

        // Cleanup on unmount
        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    return { currentLocation, setCurrentLocation };
}

// Calculate distance between two coordinates in meters (Haversine formula)
export function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
