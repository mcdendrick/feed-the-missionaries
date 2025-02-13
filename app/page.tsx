import Link from 'next/link'
import { SMSOptIn } from './components/SMSOptIn'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-4xl mx-auto p-6 md:p-10 pt-12 md:pt-16">
        <div className="text-center space-y-12">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Missionary Dinner Appointments
            </h1>
            
            <p className="text-2xl text-gray-700">
              Schedule a dinner appointment with our missionaries
            </p>
          </div>

          <div className="space-y-6">
            <Link 
              href="/schedule"
              className="inline-flex items-center justify-center px-8 py-4 text-xl bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-md hover:shadow-lg transition-all"
            >
              <span>Schedule Appointment</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="text-gray-700 space-y-3">
            <p className="text-xl">Questions? Contact:</p>
            <p className="text-2xl font-medium">
              Taylor McKendrick
              <br />
              <a 
                href="tel:+16266650251" 
                className="inline-flex items-center text-blue-600 hover:text-blue-700 hover:underline mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                (626) 665-0251
              </a>
            </p>
          </div>

          {/* SMS Opt-in Section */}
          <div className="border-t pt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">For Missionaries</h2>
            <SMSOptIn />
          </div>
        </div>
      </div>
    </main>
  )
}
