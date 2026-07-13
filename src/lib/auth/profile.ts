import "server-only";
import { prisma } from "@/lib/prisma";
import {
  ORG_TYPE_ENUM,
  type OrgTypeLabel,
  type ProfileUpdateInput,
} from "@/lib/validations/auth";
import type { OrgType } from "@prisma/client";

/** Update the current user's editable profile fields. */
export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const orgType = ORG_TYPE_ENUM[input.orgType as OrgTypeLabel] as OrgType;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      organization: input.organization,
      orgType,
      designation: input.designation,
      country: input.country,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      organization: true,
      orgType: true,
      designation: true,
      country: true,
    },
  });
  return user;
}

/** Map a Prisma OrgType enum value back to its human label (for forms). */
export function orgTypeToLabel(orgType: string): OrgTypeLabel {
  const entry = Object.entries(ORG_TYPE_ENUM).find(([, v]) => v === orgType);
  return (entry?.[0] as OrgTypeLabel) ?? "Other";
}
