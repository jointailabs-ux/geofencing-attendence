import { createServiceClient } from './supabase/server'

interface AuditLogOptions {
  orgId: string
  actorId: string
  action: string
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Creates an entry in the audit_logs table for administrative/manager actions.
 * Always uses the service role client because audit logging must succeed even if RLS
 * limits the user's write access to the audit table.
 */
export async function logAuditAction(options: AuditLogOptions) {
  try {
    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('audit_logs')
      .insert({
        org_id: options.orgId,
        actor_id: options.actorId,
        action: options.action,
        target_type: options.targetType || null,
        target_id: options.targetId || null,
        details: options.details || {},
        ip_address: options.ipAddress || null,
      })

    if (error) {
      console.error('Failed to write audit log to database:', error.message)
    }
  } catch (err) {
    console.error('Audit logging failed with error:', err)
  }
}
