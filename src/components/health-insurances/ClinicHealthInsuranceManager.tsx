"use client";

import { useEffect, useState } from "react";
import ReactSelect from "react-select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCurrentClinicHealthInsurancesAction } from "@/app/actions/health-insurances";
import { Button } from "@/components/ui/button";

type Option = {
    value: string;
    label: string;
};

interface ClinicHealthInsuranceManagerProps {
    allHealthInsurances: {
        id: string;
        name: string;
        isActive: boolean;
    }[];
    selectedIds: string[];
}

export function ClinicHealthInsuranceManager({
    allHealthInsurances,
    selectedIds,
}: ClinicHealthInsuranceManagerProps) {
    const [value, setValue] = useState<Option[]>([]);
    const [isPending, setIsPending] = useState(false);

    const options = allHealthInsurances
        .filter((item) => item.isActive)
        .map((item) => ({
            value: item.id,
            label: item.name,
        }));

    useEffect(() => {
        setValue(options.filter((option) => selectedIds.includes(option.value)));
    }, [selectedIds]);

    async function handleSave() {
        setIsPending(true);
        try {
            const result = await updateCurrentClinicHealthInsurancesAction({
                healthInsuranceIds: value.map((item) => item.value),
            });

            if (result.success) {
                toast.success("Convênios aceitos pela clínica atualizados!");
                return;
            }

            toast.error(result.error || "Erro ao atualizar convênios da clínica");
        } catch {
            toast.error("Erro ao atualizar convênios da clínica");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm text-muted-foreground">
                    Selecione quais convênios a sua clínica aceita. Depois disso, cada médico pode aceitar um subconjunto deles.
                </p>
            </div>

            <ReactSelect
                isMulti
                options={options}
                value={value}
                onChange={(nextValue) => setValue(Array.isArray(nextValue) ? [...nextValue] : [])}
                placeholder="Selecione os convênios aceitos pela clínica..."
                className="react-select-container"
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
            />

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar Convênios da Clínica
                </Button>
            </div>
        </div>
    );
}
