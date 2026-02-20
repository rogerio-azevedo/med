import { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatCardProps extends ComponentProps<"div"> {
    title: string;
    value: number | string;
    icon: LucideIcon;
    description?: string;
    iconColorClass?: string;
    iconBgClass?: string;
    href?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    iconColorClass = "text-blue-500",
    iconBgClass = "bg-blue-500/10",
    href,
    className,
    ...props
}: StatCardProps) {
    const content = (
        <Card
            className={cn(
                "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                href && "cursor-pointer",
                className
            )}
            {...props}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground truncate">
                            {title}
                        </p>
                        <p className="text-3xl font-bold tracking-tight text-foreground">
                            {value}
                        </p>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                    <div
                        className={cn(
                            "flex items-center justify-center rounded-full p-3 shrink-0",
                            iconBgClass
                        )}
                    >
                        <Icon className={cn("size-5", iconColorClass)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}
