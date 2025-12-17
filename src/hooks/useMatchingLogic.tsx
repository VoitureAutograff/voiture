import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface VehicleMatch {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: number
  location?: string
  contact_number?: string
  posted_by: string
  created_at: string
}

interface RequirementMatch {
  id: string
  make?: string
  model?: string
  year_range_min?: number
  year_range_max?: number
  price_range_min?: number
  price_range_max?: number
  location?: string
  description?: string
  posted_by: string
  users?: {
    name: string
    email: string
    phone?: string
  }
}

export function useMatchingLogic() {
  const [matches, setMatches] = useState<VehicleMatch[] | RequirementMatch[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check if posted vehicle matches any requirements
  const checkVehicleMatches = async (vehicleData: {
    make: string
    model: string
    year: number
    vehicle_type: 'car' | 'bike'
  }) => {
    setIsLoading(true)
    try {
      // Query for open requirements that match the vehicle
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          *,
          users:posted_by (
            name,
            email,
            phone
          )
        `)
        .eq('status', 'open')
        .eq('vehicle_type', vehicleData.vehicle_type)
        .ilike('make', vehicleData.make)
        .ilike('model', vehicleData.model)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error checking vehicle matches:', error)
        return []
      }

      setMatches(data || [])
      return data || []
    } catch (error) {
      console.error('Error checking vehicle matches:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Check if posted requirement matches any vehicles
  const checkRequirementMatches = async (requirementData: {
    make?: string
    model?: string
    year_range_min?: number
    year_range_max?: number
    vehicle_type: 'car' | 'bike'
  }) => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('vehicle_listings')
        .select('*')
        .eq('status', 'active')
        .eq('vehicle_type', requirementData.vehicle_type)

      // Filter by make if specified (case-insensitive, partial match)
      if (requirementData.make) {
        query = query.ilike('make', `%${requirementData.make}%`)
      }

      // Filter by model if specified (case-insensitive, partial match)
      if (requirementData.model) {
        query = query.ilike('model', `%${requirementData.model}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error checking requirement matches:', error)
        return []
      }

      setMatches(data || [])
      return data || []
    } catch (error) {
      console.error('Error checking requirement matches:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Check for partial matches (make only, or make + model)
  const checkPartialMatches = async (vehicleData: {
    make: string
    model: string
    year: number
    vehicle_type: 'car' | 'bike'
  }) => {
    setIsLoading(true)
    try {
      // First try exact match
      const exactMatches = await checkVehicleMatches(vehicleData)
      if (exactMatches.length > 0) {
        return exactMatches
      }

      // If no exact matches, try make-only matches
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          *,
          users:posted_by (
            name,
            email,
            phone
          )
        `)
        .eq('status', 'open')
        .eq('vehicle_type', vehicleData.vehicle_type)
        .eq('make', vehicleData.make)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error checking partial matches:', error)
        return []
      }

      setMatches(data || [])
      return data || []
    } catch (error) {
      console.error('Error checking partial matches:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  return {
    matches,
    isLoading,
    checkVehicleMatches,
    checkRequirementMatches,
    checkPartialMatches
  }
}
