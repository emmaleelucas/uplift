import { DistributionProvider } from "@/contexts/DistributionContext";

export default function DistributingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DistributionProvider>{children}</DistributionProvider>;
}
