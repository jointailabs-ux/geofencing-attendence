import { createServiceClient } from './supabase/server'

interface NotificationOptions {
  employeeId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'leave' | 'payroll' | 'attendance'
  actionUrl?: string
}

/**
 * Creates an entry in the notifications table for in-app alert delivery.
 * Uses service role client to bypass RLS restrictions since alerts can be triggered
 * by system automated actions (like automated payroll draft or geo-fencing logs).
 */
export async function sendNotification(options: NotificationOptions) {
  try {
    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('notifications')
      .insert({
        employee_id: options.employeeId,
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        action_url: options.actionUrl || null,
        is_read: false,
      })

    if (error) {
      console.error('Failed to insert notification:', error.message)
    }
  } catch (err) {
    console.error('Notification delivery failed with error:', err)
  }
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId: string, employeeId: string) {
  try {
    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('employee_id', employeeId)

    if (error) {
      console.error('Failed to update notification state:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('Mark read failed:', err)
    const message = err instanceof Error ? err.message : 'An unknown error occurred'
    return { success: false, error: message }
  }
}
