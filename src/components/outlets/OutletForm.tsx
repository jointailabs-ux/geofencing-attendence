'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createOutlet, updateOutlet } from '@/app/actions/outlets'
import { GeofenceMapPicker } from './GeofenceMapPicker'
import type { Outlet } from '@/lib/types/database'
import {
  MapPin,
  Building2,
  Ruler,
  Shield,
  Info,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

const outletSchema = z.object({
  name: z.string().min(1, 'Outlet name is required').max(100),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_meters: z.number().int().min(50, 'Minimum 50m').max(1000, 'Maximum 1000m'),
  buffer_meters: z.number().int().min(0).max(100, 'Maximum 100m'),
})

type OutletFormData = z.infer<typeof outletSchema>

interface OutletFormProps {
  outlet?: Outlet
}

export function OutletForm({ outlet }: OutletFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OutletFormData>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: outlet?.name ?? '',
      address: outlet?.address ?? '',
      latitude: outlet?.latitude,
      longitude: outlet?.longitude,
      radius_meters: outlet?.radius_meters ?? 100,
      buffer_meters: outlet?.buffer_meters ?? 20,
    },
  })

  const radius = watch('radius_meters') ?? 100

  function handleLocationChange(lat: number, lng: number, address?: string) {
    setValue('latitude', lat, { shouldValidate: true })
    setValue('longitude', lng, { shouldValidate: true })
    if (address) {
      setValue('address', address)
    }
  }

  async function onSubmit(data: OutletFormData) {
    setIsLoading(true)

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    try {
      if (outlet) {
        const result = await updateOutlet(outlet.id, formData)
        if (result?.error) {
          toast.error(result.error)
          setIsLoading(false)
          return
        }
        toast.success('Outlet updated successfully')
      } else {
        const result = await createOutlet(formData)
        if (result?.error) {
          toast.error(result.error)
          setIsLoading(false)
          return
        }
        toast.success('Outlet created successfully')
      }
    } catch {
      // Server action redirects on success — this catch handles that
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Back link */}
      <Link
        href="/admin/outlets"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Outlets
      </Link>

      <div className="page-header">
        <h1 className="page-title">
          {outlet ? 'Edit Outlet' : 'Add New Outlet'}
        </h1>
        <p className="page-subtitle">
          {outlet
            ? 'Update outlet details and geofence configuration'
            : 'Configure a new location with geofence boundaries for attendance tracking'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Basic info */}
        <div className="geo-card space-y-4">
          <div className="geo-card-header mb-0">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              <h2 className="geo-card-title">Outlet Details</h2>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="field-label">
              Outlet name *
            </label>
            <input
              id="name"
              {...register('name')}
              type="text"
              placeholder="Main Branch — Connaught Place"
              className="field-input"
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="address" className="field-label">
              Address
              <span className="text-slate-600 font-normal ml-1">(auto-filled when you click map)</span>
            </label>
            <input
              id="address"
              {...register('address')}
              type="text"
              placeholder="Click on the map below to auto-fill"
              className="field-input"
            />
          </div>
        </div>

        {/* Geofence map */}
        <div className="geo-card space-y-4">
          <div className="flex items-center gap-2 mb-0">
            <MapPin className="w-4 h-4 text-accent" />
            <h2 className="geo-card-title">Geofence Location *</h2>
          </div>
          <p className="text-xs text-slate-400 -mt-1">
            Click anywhere on the map to set the geofence center. You can also drag the marker to adjust.
          </p>

          {/* Hidden inputs for lat/lng */}
          <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('longitude', { valueAsNumber: true })} />

          <GeofenceMapPicker
            initialLat={outlet?.latitude}
            initialLng={outlet?.longitude}
            initialRadius={outlet?.radius_meters}
            radius={isNaN(radius) ? 100 : radius}
            onLocationChange={handleLocationChange}
          />

          {errors.latitude && (
            <p className="field-error flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {errors.latitude.message}
            </p>
          )}
        </div>

        {/* Geofence settings */}
        <div className="geo-card space-y-5">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-accent" />
            <h2 className="geo-card-title">Geofence Radius</h2>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="radius_meters" className="field-label mb-0">
                Geofence radius
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="radius_meters"
                  {...register('radius_meters', { valueAsNumber: true })}
                  type="number"
                  min={50}
                  max={1000}
                  step={10}
                  className="w-20 field-input text-center py-1.5 text-sm"
                />
                <span className="text-sm text-slate-400">m</span>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={1000}
              step={10}
              value={isNaN(radius) ? 100 : radius}
              onChange={(e) =>
                setValue('radius_meters', parseInt(e.target.value), { shouldValidate: true })
              }
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>50m</span>
              <span className="text-slate-400 font-medium">{isNaN(radius) ? 100 : radius}m selected</span>
              <span>1000m</span>
            </div>
            {errors.radius_meters && (
              <p className="field-error">{errors.radius_meters.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield className="w-3.5 h-3.5 text-warn" />
              <label htmlFor="buffer_meters" className="field-label mb-0">
                Buffer zone (grace distance)
              </label>
              <div className="group relative">
                <Info className="w-3.5 h-3.5 text-slate-600 cursor-help" />
                <div className="absolute left-5 -top-1 hidden group-hover:block w-56 bg-[#0F172A] border border-[#334155] rounded-lg p-2.5 text-xs text-slate-400 z-10 shadow-xl">
                  Staff within <strong className="text-white">radius + buffer</strong> meters will
                  be marked as &quot;Present&quot;. Staff beyond radius + buffer will be &quot;Flagged&quot;.
                  Default: 20m.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="buffer_meters"
                {...register('buffer_meters', { valueAsNumber: true })}
                type="number"
                min={0}
                max={100}
                className="w-24 field-input text-center"
              />
              <span className="text-sm text-slate-400">meters</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Staff within {isNaN(radius) ? 100 : radius}m + buffer will be marked present.
              Recommended: 15–30m.
            </p>
            {errors.buffer_meters && (
              <p className="field-error">{errors.buffer_meters.message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {outlet ? 'Saving…' : 'Creating…'}
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                {outlet ? 'Save Changes' : 'Create Outlet'}
              </>
            )}
          </button>
          <Link
            href="/admin/outlets"
            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
