"use client";

import dynamic from "next/dynamic";
import { MapProps } from "./map";

const Map = dynamic(() => import("./map"), {
    loading: () => <div className="h-[500px] w-full rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>,
    ssr: false
});

export default function MapWrapper(props: MapProps) {
    return <Map {...props} />;
}
