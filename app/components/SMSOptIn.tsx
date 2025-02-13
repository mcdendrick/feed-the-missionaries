'use client'

import { useState } from 'react'
import Image from 'next/image'

type MissionaryType = 'Elders' | 'Sisters' | 'Taylor McKendrick'

function PasswordEntry({ onCorrectPassword }: { onCorrectPassword: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProof, setShowProof] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(false)

    try {
      const verifyResponse = await fetch('/api/missionary/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (verifyResponse.ok) {
        onCorrectPassword()
      } else {
        setError(true)
      }
    } catch (error) {
      setError(true)
      console.error('Error verifying password:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <button
          onClick={() => setShowProof(!showProof)}
          className="text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
          type="button"
        >
          {showProof ? 'Hide Example' : 'View Example of SMS Notifications'}
        </button>
        
        {showProof && (
          <div className="mt-4 relative max-w-lg mx-auto">
            <Image
              src="/proof.png"
              alt="Example of SMS notifications"
              width={1000}
              height={2000}
              className="mx-auto rounded-lg shadow-lg"
              style={{ maxHeight: '100vh' }}
              priority
            />
          </div>
        )}
      </div>

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
        {error && (
          <p className="text-sm text-red-600">
            Incorrect access code. Please try again or contact your mission leader.
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Verifying...' : 'Access SMS Registration'}
        </button>
      </form>
    </div>
  )
}

export function SMSOptIn() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [type, setType] = useState<MissionaryType>('Elders')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const formattedPhone = phoneNumber.replace(/\D/g, '')
      const response = await fetch('/api/sms/opt-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: `+1${formattedPhone}`,
          type,
        }),
      })

      if (response.ok) {
        setMessage({
          text: 'Successfully signed up for SMS notifications! You should receive a confirmation message shortly.',
          type: 'success',
        })
        setPhoneNumber('')
      } else {
        throw new Error('Failed to sign up')
      }
    } catch (error) {
      setMessage({
        text: 'Failed to sign up for SMS notifications. Please try again.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <PasswordEntry onCorrectPassword={() => setIsAuthenticated(true)} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="(555) 555-5555"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Missionary Type
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as MissionaryType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="Elders">Elders</option>
              <option value="Sisters">Sisters</option>
              <option value="Taylor McKendrick">Taylor McKendrick (Testing)</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          By signing up for SMS notifications, you consent to receive automated text messages about dinner appointments from our system. Message frequency varies based on appointment scheduling. Message & data rates may apply. Reply STOP at any time to opt out. This is not a condition of service.
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Signing up...' : 'Sign up for SMS Notifications'}
        </button>

        {message && (
          <div
            className={`mt-4 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  )
} 