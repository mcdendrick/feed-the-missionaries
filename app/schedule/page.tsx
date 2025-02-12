'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Define Calendly type
interface CalendlyWindow extends Window {
  Calendly?: {
    initInlineWidget: (options: {
      url?: string;
      parentElement: Element | null;
      prefill?: Record<string, unknown>;
      utm?: Record<string, unknown>;
    }) => void;
  }
}

declare const window: CalendlyWindow

export default function SchedulePage() {
  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)

    // Initialize Calendly widget
    const initCalendly = () => {
      if (window.Calendly) {
        window.Calendly.initInlineWidget({
          url: process.env.NEXT_PUBLIC_CALENDLY_URL,
          parentElement: document.querySelector('.calendly-inline-widget'),
          prefill: {},
          utm: {}
        });
      }
    };

    script.onload = initCalendly;

    return () => {
      // Clean up script on unmount
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <Link 
          href="/"
          className="inline-flex items-center px-6 py-3 text-xl text-blue-600 hover:text-blue-700 hover:underline focus:ring-4 focus:ring-blue-300 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 my-10">
          Select a Dinner Appointment Time
        </h1>
        
        <div 
          className="calendly-inline-widget rounded-xl shadow-lg overflow-hidden bg-white" 
          data-url={`${process.env.NEXT_PUBLIC_CALENDLY_URL}?hide_gdpr_banner=1&hide_landing_page_details=1&background_color=ffffff&text_color=1e3a8a&primary_color=2563eb&hide_event_type_details=1&text_number_required=1`}
          style={{ minWidth: '320px', height: '750px' }} 
        />
      </div>
    </div>
  )
}
