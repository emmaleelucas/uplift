"use client";

import React from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Stop {
    number: number;
    name: string;
    location?: string;
    state?: string;
    notes?: string;
}

interface Route {
    name: string;
    stops: Stop[];
}

interface DownloadRoutesButtonProps {
    routes: Route[];
}

export default function DownloadRoutesButton({ routes }: DownloadRoutesButtonProps) {
    const generatePDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.setTextColor(249, 115, 22); // Orange color
        doc.text("Uplift Van Routes", 14, 22);

        // Subtitle
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Routes run every Monday, Wednesday, & Saturday starting at 6:00 PM", 14, 32);

        let yPos = 40;

        routes.forEach((route) => {
            // Route Header
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(route.name, 14, yPos);
            yPos += 5;

            // Table for this route
            const tableData = route.stops.map((stop) => [
                stop.number,
                stop.name,
                stop.location || "",
                stop.state || "",
                stop.notes || ""
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [["#", "Stop Name", "Location", "State", "Notes"]],
                body: tableData,
                theme: "grid",
                headStyles: { fillColor: [249, 115, 22] }, // Orange header
                styles: { fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: "auto" }
                },
                margin: { left: 14, right: 14 }
            });

            // Update yPos for next table
            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;
        });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("For more information, call (913) 894-2678 or visit uplift.org", 14, 285);

        doc.save("Uplift_Van_Routes.pdf");
    };

    return (
        <button
            onClick={generatePDF}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-border/50 rounded-full font-semibold hover:bg-muted transition-colors shadow-sm text-foreground cursor-pointer"
        >
            <Download className="w-5 h-5 text-orange-500" />
            Download Routes PDF
        </button>
    );
}
