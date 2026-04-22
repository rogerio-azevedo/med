"use client";

import type { Control } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    SERVICE_TYPE_TIMELINE_ICON_LABELS,
    SERVICE_TYPE_TIMELINE_ICON_OPTIONS,
} from "@/lib/service-type-timeline-icons";
import type { ServiceTypeInput } from "@/validations/service-types";

interface ServiceTypeTimelineFieldsProps {
    control: Control<ServiceTypeInput, unknown, ServiceTypeInput>;
}

export function ServiceTypeTimelineFields({ control }: ServiceTypeTimelineFieldsProps) {
    return (
        <div className="space-y-4 rounded-lg border border-muted/50 bg-muted/20 p-4">
            <div>
                <p className="text-sm font-medium text-foreground">Identidade na timeline</p>
                <p className="text-xs text-muted-foreground">
                    Ícone e cor usados no prontuário e na linha do tempo. Deixe em automático para seguir o fluxo e o
                    nome do tipo.
                </p>
            </div>

            <FormField
                control={control}
                name="timelineIconKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ícone</FormLabel>
                        <Select
                            value={field.value ? field.value : "__auto__"}
                            onValueChange={(v) => field.onChange(v === "__auto__" ? undefined : v)}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Automático" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="__auto__">Automático (por fluxo / nome)</SelectItem>
                                {SERVICE_TYPE_TIMELINE_ICON_OPTIONS.map(({ value, Icon }) => (
                                    <SelectItem key={value} value={value}>
                                        <span className="flex items-center gap-2">
                                            <Icon className="h-4 w-4 shrink-0 opacity-80" />
                                            {SERVICE_TYPE_TIMELINE_ICON_LABELS[value]}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="timelineColorHex"
                render={({ field }) => {
                    const hex = field.value && /^#[0-9A-Fa-f]{6}$/.test(field.value) ? field.value : "#64748b";
                    return (
                        <FormItem>
                            <FormLabel>Cor</FormLabel>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="color"
                                    className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                                    value={hex}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    aria-label="Escolher cor"
                                />
                                <FormControl>
                                    <Input
                                        placeholder="#RRGGBB"
                                        className="max-w-[120px] font-mono text-sm"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => field.onChange(undefined)}
                                >
                                    Automático
                                </Button>
                            </div>
                            <FormDescription>Formato hexadecimal (ex.: #0ea5e9). Vazio = cores padrão do sistema.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    );
                }}
            />
        </div>
    );
}
