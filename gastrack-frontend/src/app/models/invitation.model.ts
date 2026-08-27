/**
 * Invitation roles - subset of UserRole for invitations
 */
export type InvitationRole = 'USER' | 'ADMIN';

/**
 * Invitation status enum
 */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * Invitation entity for user onboarding
 */
export interface Invitation {
  id: string;
  email: string;
  role: InvitationRole;
  companyId: string;
  companyName: string;
  firstName?: string;
  lastName?: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  createdByEmail: string;
}

/**
 * Request payload for creating an invitation
 */
export interface CreateInvitationRequest {
  email: string;
  role: InvitationRole;
  companyId?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

/**
 * Invitation response from API (same as Invitation entity)
 */
export type InvitationResponse = Invitation;

/**
 * Status badge configuration for invitation status
 */
export const INVITATION_STATUS_BADGE: Record<
  InvitationStatus,
  { variant: 'warning' | 'success' | 'default' | 'destructive'; label: string }
> = {
  [InvitationStatus.PENDING]: { variant: 'warning', label: 'Pendente' },
  [InvitationStatus.ACCEPTED]: { variant: 'success', label: 'Aceito' },
  [InvitationStatus.EXPIRED]: { variant: 'default', label: 'Expirado' },
  [InvitationStatus.CANCELLED]: { variant: 'destructive', label: 'Cancelado' },
};
