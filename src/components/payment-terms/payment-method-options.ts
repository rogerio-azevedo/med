export const paymentMethodOptions = [
    { value: "pix", label: "PIX" },
    { value: "credit_card", label: "Cartão de Crédito" },
    { value: "debit_card", label: "Cartão de Débito" },
    { value: "boleto", label: "Boleto" },
    { value: "cash", label: "Dinheiro" },
] as const;

export function getPaymentMethodLabel(method: string | null | undefined) {
    return paymentMethodOptions.find((option) => option.value === method)?.label || "Não informado";
}
