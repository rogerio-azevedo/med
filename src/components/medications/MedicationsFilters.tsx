"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MedicationsFiltersProps {
  pharmaceuticalForms: string[];
  initialValues: {
    q: string;
    status: string;
    controlled: string;
    prescription: string;
    pharmaceuticalForm: string;
  };
}

function normalizeValue(value: string) {
  return value === "all" ? "" : value;
}

export function MedicationsFilters({
  pharmaceuticalForms,
  initialValues,
}: MedicationsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const [query, setQuery] = useState(initialValues.q);
  const [status, setStatus] = useState(initialValues.status || "all");
  const [controlled, setControlled] = useState(initialValues.controlled || "all");
  const [prescription, setPrescription] = useState(initialValues.prescription || "all");
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState(
    initialValues.pharmaceuticalForm || "all"
  );

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      initialValues.q ||
      initialValues.status ||
      initialValues.controlled ||
      initialValues.prescription ||
      initialValues.pharmaceuticalForm
    );
  }, [initialValues]);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    const nextValues = {
      q: query.trim(),
      status: normalizeValue(status),
      controlled: normalizeValue(controlled),
      prescription: normalizeValue(prescription),
      pharmaceuticalForm: normalizeValue(pharmaceuticalForm),
    };

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  }

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setControlled("all");
    setPrescription("all");
    setPharmaceuticalForm("all");
    router.push(pathname);
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-muted/20 bg-muted/20 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyFilters();
              }
            }}
            placeholder="Buscar por nome, substância, marca ou laboratório"
            className="h-11 border-muted-foreground/10 bg-white pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters ? (
            <Button type="button" variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          ) : null}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-none bg-white/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-2xl">
              <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary shadow-inner">
                    <SlidersHorizontal className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">
                      Filtros
                    </DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground/80">
                      Refine a listagem sem carregar a base inteira no navegador.
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-11 w-full border-muted-foreground/10 bg-muted/30">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={controlled} onValueChange={setControlled}>
                    <SelectTrigger className="h-11 w-full border-muted-foreground/10 bg-muted/30">
                      <SelectValue placeholder="Controlado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Controlados e não</SelectItem>
                      <SelectItem value="yes">Somente controlados</SelectItem>
                      <SelectItem value="no">Não controlados</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={prescription} onValueChange={setPrescription}>
                    <SelectTrigger className="h-11 w-full border-muted-foreground/10 bg-muted/30">
                      <SelectValue placeholder="Receita" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Com e sem receita</SelectItem>
                      <SelectItem value="yes">Exige receita</SelectItem>
                      <SelectItem value="no">Sem receita</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={pharmaceuticalForm} onValueChange={setPharmaceuticalForm}>
                    <SelectTrigger className="h-11 w-full border-muted-foreground/10 bg-muted/30">
                      <SelectValue placeholder="Forma farmacêutica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as formas</SelectItem>
                      {pharmaceuticalForms.map((form) => (
                        <SelectItem key={form} value={form}>
                          {form}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground">
                  Os filtros e a paginação são aplicados direto no banco para evitar carregar a base inteira.
                </p>
              </div>

              <DialogFooter className="flex items-center justify-between border-t bg-muted/20 p-6 sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                  Fechar
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Limpar
                  </Button>
                  <Button type="button" onClick={applyFilters} className="gap-2">
                    <Search className="h-4 w-4" />
                    Aplicar
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button type="button" onClick={applyFilters} className="gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Os filtros e a paginação são aplicados direto no banco para evitar carregar a base inteira.
      </p>
    </div>
  );
}
