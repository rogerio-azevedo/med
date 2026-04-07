"use client";

import { useEffect } from "react";
import { useHeaderStore } from "@/store/header";

export function MedicationsPageHeader() {
  const setHeader = useHeaderStore((state) => state.setHeader);

  useEffect(() => {
    setHeader(
      "Medicamentos",
      "Gerencie o catálogo de medicamentos que será usado em autocomplete e prescrição futura."
    );

    return () => useHeaderStore.getState().clearHeader();
  }, [setHeader]);

  return null;
}
