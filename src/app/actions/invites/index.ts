"use server"

import { auth } from "@/auth"
import { generateInviteCode } from "@/services/invites"
import { generateInviteSchema } from "@/validations/invite"
import { revalidatePath } from "next/cache"

export async function generateInvite(formData: FormData) {
  const session = await auth()
  const sessionRole = session?.user?.role
  const sessionClinicId = session?.user?.clinicId ?? null
  const isSuperAdmin = sessionRole === "super_admin"
  const isClinicStaff = sessionRole === "admin" || sessionRole === "doctor"

  if (!isSuperAdmin && !isClinicStaff) {
    throw new Error("Unauthorized")
  }

  const requestedClinicId = formData.get("clinicId") as string | null
  const role = formData.get("role") as "admin" | "doctor" | "patient"
  const doctorRelationshipType = formData.get("doctorRelationshipType") as
    | "linked"
    | "partner"
    | null
  const clinicId = isSuperAdmin ? requestedClinicId : sessionClinicId

  if (
    !isSuperAdmin &&
    requestedClinicId &&
    requestedClinicId !== sessionClinicId
  ) {
    throw new Error("Unauthorized")
  }

  if (role === "admin" && !isSuperAdmin) {
    throw new Error("Only super admins can generate admin invites")
  }

  if (!clinicId && !isSuperAdmin) {
    throw new Error("Unauthorized: No clinic association found.")
  }

  if (!clinicId && role !== "doctor") {
    throw new Error("Global invites are currently only supported for doctors")
  }

  const validated = generateInviteSchema.safeParse({
    clinicId: clinicId || undefined,
    role,
    doctorRelationshipType:
      role === "doctor" ? doctorRelationshipType || "linked" : undefined,
  })

  if (!validated.success) {
    return { error: "Invalid data" }
  }

  const result = await generateInviteCode(validated.data)

  if (!result.success) {
    return { error: result.error }
  }

  if (clinicId) {
    revalidatePath(`/admin/clinics/${clinicId}`)
  } else {
    revalidatePath("/admin/doctors")
  }
  return { success: true, code: result.code }
}
