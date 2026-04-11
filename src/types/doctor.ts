export interface Doctor {
    id: string;
    name: string | null;
    crm: string | null;
    crmState: string | null;
    phone: string | null;
    email: string | null;
    inviteCode?: string | null;
    relationshipType: "linked" | "partner" | null;
    isAssociated?: boolean;
    specialties: { id: string; name: string }[];
    practiceAreas: { id: string; name: string }[];
    healthInsurances: { id: string; name: string }[];
    address?: {
        id?: string | null;
        zipCode?: string | null;
        street?: string | null;
        number?: string | null;
        complement?: string | null;
        neighborhood?: string | null;
        city?: string | null;
        state?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    } | null;
    observations: string | null;
    referredPatients?: {
        patientId: string;
        patientName: string;
        createdAt: Date;
        source: "patient_reported" | "doctor_reported" | "invite_link" | "manual";
    }[];
}
