import fs from 'fs/promises'
import path from 'path'

interface ConsentRecord {
  phoneNumber: string;
  missionaryType: string;
  timestamp: string;
  consentText: string;
  ipAddress: string;
  method: 'web_form' | 'sms';
  status: 'opted_in' | 'opted_out';
}

const CONSENT_LOG_DIR = 'consent-logs'
const CONSENT_TEXT = `By signing up for SMS notifications, you consent to receive automated text messages about dinner appointments from our system. Message frequency varies based on appointment scheduling. Message & data rates may apply. Reply STOP at any time to opt out. This is not a condition of service.`

export async function logConsent(
  phoneNumber: string,
  missionaryType: string,
  ipAddress: string,
  status: 'opted_in' | 'opted_out' = 'opted_in',
  method: 'web_form' | 'sms' = 'web_form'
): Promise<void> {
  try {
    // Ensure the consent logs directory exists
    const logDir = path.join(process.cwd(), CONSENT_LOG_DIR)
    await fs.mkdir(logDir, { recursive: true })

    // Create the consent record
    const record: ConsentRecord = {
      phoneNumber,
      missionaryType,
      timestamp: new Date().toISOString(),
      consentText: CONSENT_TEXT,
      ipAddress,
      method,
      status
    }

    // Create filename based on phone number and timestamp
    const sanitizedPhone = phoneNumber.replace(/\+/g, '').replace(/\D/g, '')
    const filename = `${sanitizedPhone}_${record.timestamp.split('T')[0]}.json`
    const logPath = path.join(logDir, filename)

    // Read existing records for this phone number if they exist
    let records: ConsentRecord[] = []
    try {
      const existingContent = await fs.readFile(logPath, 'utf-8')
      records = JSON.parse(existingContent)
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }

    // Add new record and write back to file
    records.push(record)
    await fs.writeFile(logPath, JSON.stringify(records, null, 2))

    console.log(`Consent record logged for ${phoneNumber}`)
  } catch (error) {
    console.error('Error logging consent:', error)
    throw error
  }
}

export async function getConsentHistory(phoneNumber: string): Promise<ConsentRecord[]> {
  try {
    const sanitizedPhone = phoneNumber.replace(/\+/g, '').replace(/\D/g, '')
    const logDir = path.join(process.cwd(), CONSENT_LOG_DIR)
    
    // List all files in the consent logs directory
    const files = await fs.readdir(logDir)
    
    // Find files for this phone number
    const relevantFiles = files.filter(f => f.startsWith(sanitizedPhone))
    
    // Read and combine all records
    const allRecords: ConsentRecord[] = []
    for (const file of relevantFiles) {
      const content = await fs.readFile(path.join(logDir, file), 'utf-8')
      const records: ConsentRecord[] = JSON.parse(content)
      allRecords.push(...records)
    }
    
    // Sort by timestamp, most recent first
    return allRecords.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  } catch (error) {
    console.error('Error getting consent history:', error)
    return []
  }
} 