'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Appointment {
  eventId: string
  inviteeName: string
  email?: string
  phoneNumber?: string
  startTime: string
  address?: string
}

function PasswordEntry({ onCorrectPassword, onError }: { 
  onCorrectPassword: (token: string) => void
  onError: (error: string) => void 
}) {
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // First verify the password
      const verifyResponse = await fetch('/api/missionary/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (verifyResponse.ok) {
        const { sessionToken } = await verifyResponse.json()
        onCorrectPassword(sessionToken)
      } else {
        if (verifyResponse.status === 401) {
          onError('Incorrect password. Please try again.')
        } else {
          onError('An error occurred. Please try again.')
        }
      }
    } catch (error) {
      onError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Enter Missionary Access Code
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter access code"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Verifying...' : 'View Appointments'}
        </button>
      </form>
    </div>
  )
}

function AppointmentList({ sessionToken }: { sessionToken: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await fetch('/api/missionary/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken }),
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Your session has expired. Please refresh the page and log in again.')
          } else {
            throw new Error('Failed to fetch appointments')
          }
          return
        }
        
        const data = await response.json()
        setAppointments(data.appointments)
      } catch (err) {
        setError('Failed to load appointments. Please try again later.')
        console.error('Error fetching appointments:', err)
      } finally {
        setLoading(false)
      }
    }

    if (sessionToken) {
      fetchAppointments()
    }
  }, [sessionToken])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading appointments...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No upcoming appointments found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Upcoming Appointments</h2>
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-700 hover:underline"
        >
          Back to Home
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <li key={appointment.eventId} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-medium text-gray-900">
                    {appointment.inviteeName}
                  </p>
                  <p className="text-gray-600">
                    {format(new Date(appointment.startTime), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-gray-600">
                    {format(new Date(appointment.startTime), 'h:mm a')}
                  </p>
                  {appointment.address && (
                    <p className="text-gray-600">
                      📍 {appointment.address}
                    </p>
                  )}
                  {appointment.phoneNumber && (
                    <p className="text-gray-600">
                      📱 {appointment.phoneNumber}
                    </p>
                  )}
                  {appointment.email && (
                    <p className="text-gray-600">
                      ✉️ {appointment.email}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionToken, setSessionToken] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleCorrectPassword = (token: string) => {
    setIsAuthenticated(true)
    setSessionToken(token)
    setError(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Missionary Appointments
          </h1>
          <PasswordEntry 
            onCorrectPassword={handleCorrectPassword}
            onError={setError}
          />
          {error && (
            <div className="mt-4 text-center text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <AppointmentList sessionToken={sessionToken} />
      </div>
    </div>
  )
} 