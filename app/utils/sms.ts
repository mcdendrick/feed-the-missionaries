import twilio from 'twilio'
import fs from 'fs/promises'
import path from 'path'

// Create Twilio client outside the function to avoid recreating it each time
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface Missionary {
  phoneNumber: string;
  type: 'Elders' | 'Sisters';
  optedIn: boolean;
}

function parseMissionaryPhones(): Missionary[] {
  const phoneString = process.env.MISSIONARY_PHONE_NUMBERS || '';
  return phoneString.split(',').map(entry => {
    const [phoneNumber, type, optedIn] = entry.split(':');
    return {
      phoneNumber: phoneNumber.trim(),
      type: type?.trim() as 'Elders' | 'Sisters',
      optedIn: optedIn?.trim().toLowerCase() === 'true'
    };
  });
}

export async function updateMissionaryOptIn(phoneNumber: string, optIn: boolean): Promise<boolean> {
  try {
    // Get current missionaries
    const missionaries = parseMissionaryPhones();
    const missionary = missionaries.find(m => m.phoneNumber === phoneNumber);

    if (!missionary) {
      console.log(`Phone number ${phoneNumber} not found in missionary list`);
      return false;
    }

    // Update the opt-in status
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    // Create the new missionary phone string
    const updatedPhoneNumbers = missionaries.map(m => {
      if (m.phoneNumber === phoneNumber) {
        return `${m.phoneNumber}:${m.type}:${optIn}`;
      }
      return `${m.phoneNumber}:${m.type}:${m.optedIn}`;
    }).join(',');

    // Update the .env.local file
    const updatedContent = envContent.replace(
      /^MISSIONARY_PHONE_NUMBERS=.*$/m,
      `MISSIONARY_PHONE_NUMBERS="${updatedPhoneNumbers}"`
    );

    await fs.writeFile(envPath, updatedContent);
    
    // Log the change
    console.log(`Updated opt-in status for ${missionary.type} to ${optIn}`);
    return true;
  } catch (error) {
    console.error('Error updating missionary opt-in status:', error);
    return false;
  }
}

export async function sendSMSNotification(message: string) {
  try {
    // Log the Twilio configuration
    console.log('Twilio Configuration:');
    console.log('- Account SID:', process.env.TWILIO_ACCOUNT_SID);
    console.log('- From Number:', process.env.TWILIO_FROM_NUMBER);

    // Get missionaries who have opted in
    const missionaries = parseMissionaryPhones();
    const optedInMissionaries = missionaries.filter(m => m.optedIn);
    
    console.log('Sending to:', optedInMissionaries.map(m => m.type).join(' and '));

    // Send messages one at a time to better track failures
    for (const missionary of optedInMissionaries) {
      try {
        const response = await twilioClient.messages.create({
          body: message,
          to: missionary.phoneNumber,
          from: process.env.TWILIO_FROM_NUMBER,
        });
        
        console.log(`SMS sent successfully to ${missionary.type}:`, {
          sid: response.sid,
          status: response.status,
          errorCode: response.errorCode,
          errorMessage: response.errorMessage
        });
      } catch (error) {
        const twilioError = error as { message: string; code: string; moreInfo?: string };
        console.error(`Failed to send SMS to ${missionary.type}:`, {
          error: twilioError.message,
          code: twilioError.code,
          moreInfo: twilioError.moreInfo
        });
        // Continue with other numbers even if one fails
        continue;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in sendSMSNotification:', error);
    return false;
  }
} 