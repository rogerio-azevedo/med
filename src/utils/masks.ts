/**
 * Applies a Brazilian phone mask to a string as the user types.
 * Supports both 8-digit (landline) and 9-digit (mobile) formats.
 * Examples:
 *   (65) 99928-6747   — mobile
 *   (11) 3456-7890    — landline
 */
export function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    // 11 digits — mobile (9-digit number)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
