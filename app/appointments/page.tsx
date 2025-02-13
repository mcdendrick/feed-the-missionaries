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
  const [deletedAppointments, setDeletedAppointments] = useState<string[]>([])

  useEffect(() => {
    // Load deleted appointments from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deletedAppointments');
      if (stored) {
        setDeletedAppointments(JSON.parse(stored));
      }
    }
  }, []);

  const handleDelete = async (eventId: string) => {
    try {
      const response = await fetch('/api/missionary/appointments/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken, eventId }),
      });

      if (response.ok) {
        // Update local state
        setDeletedAppointments(prev => [...prev, eventId]);
        // Remove from current appointments
        setAppointments(prev => prev.filter(a => a.eventId !== eventId));
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

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
        // Filter out manually deleted appointments
        const filteredAppointments = data.appointments.filter(
          (apt: Appointment) => !deletedAppointments.includes(apt.eventId)
        );
        setAppointments(filteredAppointments)
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
  }, [sessionToken, deletedAppointments])

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

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((groups, appointment) => {
    const date = format(new Date(appointment.startTime), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Upcoming Appointments</h2>
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-700 hover:underline"
        >
          Back to Home
        </Link>
      </div>

      <div className="space-y-8">
        {Object.entries(appointmentsByDate).map(([date, dayAppointments]) => (
          <div key={date} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h3 className="text-xl font-semibold">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {dayAppointments.map((appointment) => (
                <div key={appointment.eventId} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-grow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-medium text-gray-900">
                            {format(new Date(appointment.startTime), 'h:mm a')}
                          </span>
                          <span className="text-lg font-medium text-gray-900">
                            {appointment.inviteeName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(appointment.eventId)}
                          className="text-red-600 hover:text-red-800 focus:outline-none"
                          title="Remove appointment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {appointment.address && (
                          <p className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {appointment.address}
                          </p>
                        )}
                        {appointment.phoneNumber && (
                          <p className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {appointment.phoneNumber}
                          </p>
                        )}
                        {appointment.email && (
                          <p className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {appointment.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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