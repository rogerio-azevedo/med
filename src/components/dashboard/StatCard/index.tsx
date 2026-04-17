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
                /* Card base usa py-6/gap-6; aqui zeramos para o conteúdo não “flutuar” alto */
                "gap-0 py-0 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                href && "cursor-pointer",
                className
            )}
            {...props}
        >
            <CardContent className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-0">
                        <p className="truncate text-xs font-medium text-muted-foreground">
                            {title}
                        </p>
                        <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
                            {value}
                        </p>
                        {description && (
                            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    <div
                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full p-1.5",
                            iconBgClass
                        )}
                    >
                        <Icon className={cn("size-3.5", iconColorClass)} />
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
