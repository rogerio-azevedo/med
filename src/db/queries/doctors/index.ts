import { db } from "@/db";
import {
    doctors,
    clinicDoctors,
    users,
    doctorSpecialties,
    specialties,
    doctorPracticeAreas,
    practiceAreas,
    doctorHealthInsurances,
    healthInsurances,
    addresses,
    inviteLinks,
    patientReferrals,
    patients,
} from "@/db/schema";
import { eq, and, asc, inArray, isNull, or, sql, ilike, isNotNull } from "drizzle-orm";
import { type Doctor as DoctorListItem } from "@/types/doctor";

export type ReferredPatientRow = {
    patientId: string;
    patientName: string;
    createdAt: Date;
    source: "patient_reported" | "doctor_reported" | "invite_link" | "manual";
};

export type ReferredPatientsByDoctor = Map<string, ReferredPatientRow[]>;

type DoctorListJoinRow = {
    id: string;
    crm: string | null;
    crmState: string | null;
    phone: string | null;
    relationshipType: "linked" | "partner" | null;
    isAssociated: string | null;
    name: string | null;
    email: string | null;
    observations: string | null;
    specialtyId: string | null;
    specialtyName: string | null;
    practiceAreaId: string | null;
    practiceAreaName: string | null;
    healthInsuranceId: string | null;
    healthInsuranceName: string | null;
    inviteCode: string | null;
    address: {
        id: string | null;
        zipCode: string | null;
        street: string | null;
        number: string | null;
        complement: string | null;
        neighborhood: string | null;
        city: string | null;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
    };
};

function accumulateDoctorsFromJoinRows(
    rawResults: DoctorListJoinRow[],
    referredPatients: ReferredPatientsByDoctor
): Map<string, DoctorListItem> {
    const doctorsMap = new Map<string, DoctorListItem>();

    for (const row of rawResults) {
        if (!doctorsMap.has(row.id)) {
            const hasAddress = row.address && row.address.id !== null;
            doctorsMap.set(row.id, {
                id: row.id,
                crm: row.crm,
                crmState: row.crmState,
                phone: row.phone,
                relationshipType: row.relationshipType ?? null,
                isAssociated: !!row.isAssociated,
                name: row.name,
                email: row.email,
                observations: row.observations,
                inviteCode: row.inviteCode,
                address: hasAddress ? row.address : null,
                specialties: [],
                practiceAreas: [],
                healthInsurances: [],
                referredPatients: referredPatients.get(row.id) ?? [],
            });
        } else {
            const doctor = doctorsMap.get(row.id);
            if (doctor && row.inviteCode && !doctor.inviteCode) {
                doctor.inviteCode = row.inviteCode;
            }
        }

        if (row.specialtyId && row.specialtyName) {
            const doctor = doctorsMap.get(row.id);
            if (doctor && !doctor.specialties.some((s) => s.id === row.specialtyId)) {
                doctor.specialties.push({
                    id: row.specialtyId,
                    name: row.specialtyName,
                });
            }
        }

        if (row.practiceAreaId && row.practiceAreaName) {
            const doctor = doctorsMap.get(row.id);
            if (doctor && !doctor.practiceAreas.some((p) => p.id === row.practiceAreaId)) {
                doctor.practiceAreas.push({
                    id: row.practiceAreaId,
                    name: row.practiceAreaName,
                });
            }
        }

        if (row.healthInsuranceId && row.healthInsuranceName) {
            const doctor = doctorsMap.get(row.id);
            if (doctor && !doctor.healthInsurances.some((item) => item.id === row.healthInsuranceId)) {
                doctor.healthInsurances.push({
                    id: row.healthInsuranceId,
                    name: row.healthInsuranceName,
                });
            }
        }
    }

    return doctorsMap;
}

const doctorListSelectShape = {
    id: doctors.id,
    crm: doctors.crm,
    crmState: doctors.crmState,
    phone: doctors.phone,
    relationshipType: clinicDoctors.relationshipType,
    isAssociated: clinicDoctors.id,
    name: users.name,
    email: users.email,
    observations: doctors.observations,
    specialtyId: specialties.id,
    specialtyName: specialties.name,
    practiceAreaId: practiceAreas.id,
    practiceAreaName: practiceAreas.name,
    healthInsuranceId: healthInsurances.id,
    healthInsuranceName: healthInsurances.name,
    inviteCode: inviteLinks.code,
    address: {
        id: addresses.id,
        zipCode: addresses.zipCode,
        street: addresses.street,
        number: addresses.number,
        complement: addresses.complement,
        neighborhood: addresses.neighborhood,
        city: addresses.city,
        state: addresses.state,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
    },
} as const;

export type DoctorListFilters = {
    query?: string;
    relationshipType?: "linked" | "partner";
    /**
     * Quando true (padrão), exclui médicos sem vínculo ativo com a clínica.
     * Equivale ao checkbox "Ocultar médicos sem vínculo" marcado.
     */
    hideUnassociated?: boolean;
    page?: number;
    pageSize?: number;
};

function cleanDoctorListQuery(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
}

/** Como em produção: vinculados primeiro, depois parceiros; sem vínculo por último. */
const doctorListRelationshipSortRank = sql`(
  CASE ${clinicDoctors.relationshipType}
    WHEN 'linked' THEN 0
    WHEN 'partner' THEN 1
    ELSE 2
  END
)`;

/**
 * Chave de nome alinhada ao que esperamos na UI: sem espaços nas pontas, ignorando caixa.
 * COLLATE "C" deixa a ordem byte-a-byte previsível (ex.: A antes de E), evitando surpresas
 * da collation padrão do banco, que pode divergir de pt-BR.
 */
const doctorListNameSortKeySql = sql`LOWER(TRIM(BOTH FROM COALESCE(${users.name}, ''))) COLLATE "C"`;

function doctorListRelationshipRankForSort(doctor: DoctorListItem): number {
    if (!doctor.isAssociated) return 2;
    if (doctor.relationshipType === "linked") return 0;
    if (doctor.relationshipType === "partner") return 1;
    return 2;
}

function compareDoctorsForListOrder(a: DoctorListItem, b: DoctorListItem): number {
    const ra = doctorListRelationshipRankForSort(a);
    const rb = doctorListRelationshipRankForSort(b);
    if (ra !== rb) return ra - rb;
    const nameCmp = (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" });
    if (nameCmp !== 0) return nameCmp;
    return a.id.localeCompare(b.id);
}

function buildDoctorListBaseWhere(
    clinicId: string,
    filters: DoctorListFilters
) {
    const hideUnassociated = filters.hideUnassociated !== false;

    const conditions = [
        eq(users.role, "doctor"),
        or(eq(clinicDoctors.isActive, true), isNull(clinicDoctors.id)),
    ];

    if (hideUnassociated) {
        conditions.push(isNotNull(clinicDoctors.id));
    }

    const normalizedQuery = cleanDoctorListQuery(filters.query);
    if (normalizedQuery) {
        conditions.push(ilike(users.name, `%${normalizedQuery}%`));
    }

    if (filters.relationshipType) {
        conditions.push(eq(clinicDoctors.relationshipType, filters.relationshipType));
        conditions.push(isNotNull(clinicDoctors.id));
    }

    return and(...conditions);
}

export async function getPaginatedDoctors(clinicId: string, filters: DoctorListFilters = {}) {
    const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25;
    const requestedPage = filters.page && filters.page > 0 ? filters.page : 1;
    const whereClause = buildDoctorListBaseWhere(clinicId, filters);

    const clinicDoctorJoin = and(
        eq(clinicDoctors.doctorId, doctors.id),
        eq(clinicDoctors.clinicId, clinicId)
    );

    const [countRow] = await db
        .select({ count: sql<number>`count(distinct ${doctors.id})::int` })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .leftJoin(clinicDoctors, clinicDoctorJoin)
        .where(whereClause);

    const total = countRow?.count ?? 0;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;

    const idRows = await db
        .select({ id: doctors.id })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .leftJoin(clinicDoctors, clinicDoctorJoin)
        .where(whereClause)
        .orderBy(
            asc(doctorListRelationshipSortRank),
            sql`${doctorListNameSortKeySql} ASC`,
            asc(doctors.id)
        )
        .limit(pageSize)
        .offset(offset);

    const ids = idRows.map((row) => row.id);

    if (ids.length === 0) {
        return {
            items: [] as DoctorListItem[],
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
            },
        };
    }

    const referredPatients =
        ids.length > 0
            ? await getReferredPatientsByClinic(clinicId, ids)
            : new Map<string, ReferredPatientRow[]>();

    const rawResults = await db
        .select(doctorListSelectShape)
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .leftJoin(clinicDoctors, clinicDoctorJoin)
        .leftJoin(doctorSpecialties, eq(doctorSpecialties.doctorId, doctors.id))
        .leftJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
        .leftJoin(doctorPracticeAreas, eq(doctorPracticeAreas.doctorId, doctors.id))
        .leftJoin(practiceAreas, eq(doctorPracticeAreas.practiceAreaId, practiceAreas.id))
        .leftJoin(
            doctorHealthInsurances,
            and(
                eq(doctorHealthInsurances.doctorId, doctors.id),
                eq(doctorHealthInsurances.isActive, true)
            )
        )
        .leftJoin(
            healthInsurances,
            and(
                eq(doctorHealthInsurances.healthInsuranceId, healthInsurances.id),
                eq(healthInsurances.isActive, true)
            )
        )
        .leftJoin(
            addresses,
            and(eq(addresses.entityId, doctors.id), eq(addresses.entityType, "doctor"))
        )
        .leftJoin(
            inviteLinks,
            and(
                eq(inviteLinks.doctorId, doctors.id),
                eq(inviteLinks.clinicId, clinicId),
                eq(inviteLinks.role, "patient"),
                eq(inviteLinks.isActive, true)
            )
        )
        .where(and(whereClause, inArray(doctors.id, ids)));

    const doctorsMap = accumulateDoctorsFromJoinRows(
        rawResults as DoctorListJoinRow[],
        referredPatients
    );

    const items = ids
        .map((id) => doctorsMap.get(id))
        .filter((d): d is DoctorListItem => d !== undefined)
        .sort(compareDoctorsForListOrder);

    return {
        items,
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
        },
    };
}

export async function getDoctorsByClinic(clinicId: string) {
    const referredPatients = await getReferredPatientsByClinic(clinicId);
    const rawResults = await db
        .select(doctorListSelectShape)
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .leftJoin(
            clinicDoctors,
            and(
                eq(clinicDoctors.doctorId, doctors.id),
                eq(clinicDoctors.clinicId, clinicId)
            )
        )
        .leftJoin(doctorSpecialties, eq(doctorSpecialties.doctorId, doctors.id))
        .leftJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
        .leftJoin(doctorPracticeAreas, eq(doctorPracticeAreas.doctorId, doctors.id))
        .leftJoin(practiceAreas, eq(doctorPracticeAreas.practiceAreaId, practiceAreas.id))
        .leftJoin(
            doctorHealthInsurances,
            and(
                eq(doctorHealthInsurances.doctorId, doctors.id),
                eq(doctorHealthInsurances.isActive, true)
            )
        )
        .leftJoin(
            healthInsurances,
            and(
                eq(doctorHealthInsurances.healthInsuranceId, healthInsurances.id),
                eq(healthInsurances.isActive, true)
            )
        )
        .leftJoin(
            addresses,
            and(
                eq(addresses.entityId, doctors.id),
                eq(addresses.entityType, "doctor")
            )
        )
        .leftJoin(
            inviteLinks,
            and(
                eq(inviteLinks.doctorId, doctors.id),
                eq(inviteLinks.clinicId, clinicId),
                eq(inviteLinks.role, "patient"),
                eq(inviteLinks.isActive, true)
            )
        )
        .where(
            and(
                eq(users.role, "doctor"),
                or(eq(clinicDoctors.isActive, true), isNull(clinicDoctors.id))
            )
        )
        .orderBy(
            asc(doctorListRelationshipSortRank),
            sql`${doctorListNameSortKeySql} ASC`,
            asc(doctors.id)
        );

    const doctorsMap = accumulateDoctorsFromJoinRows(
        rawResults as DoctorListJoinRow[],
        referredPatients
    );

    return Array.from(doctorsMap.values()).sort(compareDoctorsForListOrder);
}

export async function getReferredPatientsByClinic(
    clinicId: string,
    doctorIds?: string[]
): Promise<ReferredPatientsByDoctor> {
    const baseConditions = [
        eq(patientReferrals.clinicId, clinicId),
        eq(patientReferrals.status, "active"),
    ];

    if (doctorIds && doctorIds.length > 0) {
        baseConditions.push(inArray(patientReferrals.doctorId, doctorIds));
    }

    const rows = await db
        .select({
            doctorId: patientReferrals.doctorId,
            patientId: patients.id,
            patientName: patients.name,
            createdAt: patientReferrals.createdAt,
            source: patientReferrals.source,
        })
        .from(patientReferrals)
        .innerJoin(patients, eq(patientReferrals.patientId, patients.id))
        .where(and(...baseConditions))
        .orderBy(asc(patients.name));

    const grouped = new Map<string, ReferredPatientRow[]>();

    for (const row of rows) {
        const current = grouped.get(row.doctorId) ?? [];
        current.push({
            patientId: row.patientId,
            patientName: row.patientName,
            createdAt: row.createdAt,
            source: row.source,
        });
        grouped.set(row.doctorId, current);
    }

    return grouped;
}

export async function deleteDoctor(doctorId: string, clinicId: string) {
    // Soft delete: set isActive to false for the clinic association
    await db
        .update(clinicDoctors)
        .set({ isActive: false })
        .where(
            and(
                eq(clinicDoctors.doctorId, doctorId),
                eq(clinicDoctors.clinicId, clinicId)
            )
        );

    return { success: true };
}

export type GetDoctorsSimpleOptions = {
    /** Se omitido, inclui `linked` e `partner`. */
    relationshipTypes?: ("linked" | "partner")[];
};

export async function getDoctorsSimple(clinicId: string, options?: GetDoctorsSimpleOptions) {
    const relationshipFilter =
        options?.relationshipTypes && options.relationshipTypes.length > 0
            ? inArray(clinicDoctors.relationshipType, options.relationshipTypes)
            : undefined;

    const result = await db
        .select({
            id: doctors.id,
            name: users.name,
            relationshipType: clinicDoctors.relationshipType,
        })
        .from(doctors)
        .innerJoin(
            users,
            and(eq(doctors.userId, users.id), eq(users.role, "doctor"))
        )
        .innerJoin(
            clinicDoctors,
            and(
                eq(clinicDoctors.doctorId, doctors.id),
                eq(clinicDoctors.clinicId, clinicId),
                eq(clinicDoctors.isActive, true),
                ...(relationshipFilter ? [relationshipFilter] : [])
            )
        );

    const seen = new Set<string>();
    const unique = result.filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
    });

    return unique.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" })
    );
}

export async function getDoctorDetails(doctorId: string, clinicId: string) {
    const rawResults = await db
        .select({
            id: doctors.id,
            crm: doctors.crm,
            crmState: doctors.crmState,
            phone: doctors.phone,
            relationshipType: clinicDoctors.relationshipType,
            observations: doctors.observations,
            name: users.name,
            email: users.email,
            specialtyId: specialties.id,
            specialtyName: specialties.name,
            practiceAreaId: practiceAreas.id,
            practiceAreaName: practiceAreas.name,
            healthInsuranceId: healthInsurances.id,
            healthInsuranceName: healthInsurances.name,
            address: {
                id: addresses.id,
                zipCode: addresses.zipCode,
                street: addresses.street,
                number: addresses.number,
                complement: addresses.complement,
                neighborhood: addresses.neighborhood,
                city: addresses.city,
                state: addresses.state,
                latitude: addresses.latitude,
                longitude: addresses.longitude,
            }
        })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .innerJoin(clinicDoctors, eq(clinicDoctors.doctorId, doctors.id))
        .leftJoin(doctorSpecialties, eq(doctorSpecialties.doctorId, doctors.id))
        .leftJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
        .leftJoin(doctorPracticeAreas, eq(doctorPracticeAreas.doctorId, doctors.id))
        .leftJoin(practiceAreas, eq(doctorPracticeAreas.practiceAreaId, practiceAreas.id))
        .leftJoin(
            doctorHealthInsurances,
            and(
                eq(doctorHealthInsurances.doctorId, doctors.id),
                eq(doctorHealthInsurances.isActive, true)
            )
        )
        .leftJoin(
            healthInsurances,
            and(
                eq(doctorHealthInsurances.healthInsuranceId, healthInsurances.id),
                eq(healthInsurances.isActive, true)
            )
        )
        .leftJoin(
            addresses,
            and(
                eq(addresses.entityId, doctors.id),
                eq(addresses.entityType, "doctor")
            )
        )
        .where(
            and(
                eq(doctors.id, doctorId),
                eq(clinicDoctors.clinicId, clinicId),
                eq(clinicDoctors.isActive, true)
            )
        );

    if (rawResults.length === 0) return null;

    const doctorData = {
        id: rawResults[0].id,
        name: rawResults[0].name,
        email: rawResults[0].email,
        phone: rawResults[0].phone,
        crm: rawResults[0].crm,
        crmState: rawResults[0].crmState,
        relationshipType: rawResults[0].relationshipType,
        observations: rawResults[0].observations,
        address: rawResults[0].address?.id ? rawResults[0].address : null,
        specialties: [] as { id: string; name: string }[],
        practiceAreas: [] as { id: string; name: string }[],
        healthInsurances: [] as { id: string; name: string }[],
    };

    const addedSpecialties = new Set<string>();
    const addedPracticeAreas = new Set<string>();
    const addedHealthInsurances = new Set<string>();

    for (const row of rawResults) {
        if (row.specialtyId && row.specialtyName && !addedSpecialties.has(row.specialtyId)) {
            doctorData.specialties.push({ id: row.specialtyId, name: row.specialtyName });
            addedSpecialties.add(row.specialtyId);
        }
        if (row.practiceAreaId && row.practiceAreaName && !addedPracticeAreas.has(row.practiceAreaId)) {
            doctorData.practiceAreas.push({ id: row.practiceAreaId, name: row.practiceAreaName });
            addedPracticeAreas.add(row.practiceAreaId);
        }
        if (row.healthInsuranceId && row.healthInsuranceName && !addedHealthInsurances.has(row.healthInsuranceId)) {
            doctorData.healthInsurances.push({ id: row.healthInsuranceId, name: row.healthInsuranceName });
            addedHealthInsurances.add(row.healthInsuranceId);
        }
    }

    return doctorData;
}
