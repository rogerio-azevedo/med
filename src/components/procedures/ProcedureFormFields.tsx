import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Control } from "react-hook-form";
import type { ProcedureFormValues } from "./procedure-form-schema";

interface ProcedureFormFieldsProps {
    control: Control<ProcedureFormValues>;
}

export function ProcedureFormFields({ control }: ProcedureFormFieldsProps) {
    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-11 w-full border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="general">GERAL</SelectItem>
                                <SelectItem value="consultation">CONSULTA</SelectItem>
                                <SelectItem value="exam">EXAME</SelectItem>
                                <SelectItem value="therapy">TERAPIA</SelectItem>
                                <SelectItem value="hospitalization">INTERNAÇÃO</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="tussCode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Código TUSS</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Ex: 30201012"
                                {...field}
                                value={field.value ?? ""}
                                className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Ex: Colecistectomia videolaparoscópica"
                                {...field}
                                className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="purpose"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Finalidade</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Ex: Cirúrgico"
                                {...field}
                                value={field.value ?? ""}
                                className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Detalhes clínicos ou observações sobre o procedimento"
                                {...field}
                                value={field.value ?? ""}
                                className="min-h-28 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
