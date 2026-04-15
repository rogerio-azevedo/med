"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PlanTabProps = {
    planValue: string;
    onPlanChange: (value: string) => void;
};

export function PlanTab({ planValue, onPlanChange }: PlanTabProps) {
    return (
        <div className="space-y-2">
            <Label className="text-lg font-semibold">
                Conduta / Orientações ao Paciente
            </Label>
            <Textarea
                placeholder="Descreva as orientações, próximas etapas e plano de cuidado..."
                className="min-h-[300px]"
                value={planValue}
                onChange={(e) => onPlanChange(e.target.value)}
            />
        </div>
    );
}
