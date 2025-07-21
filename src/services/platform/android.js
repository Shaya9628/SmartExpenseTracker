import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import SmsAndroid from 'react-native-get-sms-android';

// Bank sender IDs to filter SMS
const BANK_SENDERS = ['HDFCBK', 'ICICIB', 'SBIINB', 'AXISBK', 'BOIIND', 'CENTBK'];

// Bank SMS patterns for parsing
const BANK_PATTERNS = {
  HDFC: /HDFC Bank: (Rs\.|INR) ([\d,]+\.?\d*) (credited to|debited from) your (a\/c|account) (\w+) on (\d{2}-\d{2}-\d{2})/i,
  ICICI: /ICICI Bank (A\/c|Account) (\w+) (credited|debited) with (Rs\.|INR) ([\d,]+\.?\d*) on (\d{2}-\d{2}-\d{2})/i,
  SBI: /SBI (A\/c|Account) (\w+) (credited|debited) with (Rs\.|INR) ([\d,]+\.?\d*) on (\d{2}-\d{2}-\d{2})/i,
  AXIS: /Axis Bank (A\/c|Account) (\w+) (credited|debited) (Rs\.|INR) ([\d,]+\.?\d*) on (\d{2}-\d{2}-\d{2})/i,
  BOI: /BOI: (Rs\.|INR) ([\d,]+\.?\d*) (credited to|debited from) (A\/c|Account) (\w+) on (\d{2}-\d{2}-\d{2})/i,
};

const CATEGORIES = {
  'FOOD': ['swiggy', 'zomato', 'restaurant', 'food', 'dining'],
  'SHOPPING': ['amazon', 'flipkart', 'myntra', 'shopping'],
  'TRANSPORT': ['uber', 'ola', 'metro', 'petrol', 'fuel'],
  'BILLS': ['electricity', 'water', 'gas', 'mobile', 'broadband'],
  'ENTERTAINMENT': ['netflix', 'amazon prime', 'hotstar', 'movie'],
  'HEALTH': ['hospital', 'medical', 'pharmacy', 'doctor'],
  'OTHERS': []
};

const detectCategory = (description) => {
  description = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => description.includes(keyword))) {
      return category;
    }
  }
  return 'OTHERS';
};

const detectBank = (sender, body) => {
  const bankNames = Object.keys(BANK_PATTERNS);
  return bankNames.find(bank => 
    sender.toUpperCase().includes(bank) || 
    body.toUpperCase().includes(bank)
  ) || 'UNKNOWN';
};

const parseSMS = (sms) => {
  const bank = detectBank(sms.address, sms.body);
  if (!bank || bank === 'UNKNOWN') return null;

  const patterns = BANK_PATTERNS[bank];
  const body = sms.body.toLowerCase();

  // Try to find debit or credit amount
  const match = body.match(patterns);
  if (!match) return null;

  const amount = parseFloat(match[2].replace(/,/g, ''));
  const type = match[3] === 'credited' ? 'CREDIT' : 'DEBIT';
  const account = match[5] || null;

  return {
    type,
    amount,
    date: new Date(parseInt(sms.date)).toISOString(),
    description: sms.body,
    category: detectCategory(sms.body),
    bank,
    account,
    rawSms: sms.body
  };
};

export const requestSMSPermission = async () => {
  try {
    // Check both READ_SMS and RECEIVE_SMS permissions
    const readStatus = await check(PERMISSIONS.ANDROID.READ_SMS);
    const receiveStatus = await check(PERMISSIONS.ANDROID.RECEIVE_SMS);

    // If both permissions are granted, return true
    if (readStatus === RESULTS.GRANTED && receiveStatus === RESULTS.GRANTED) {
      return true;
    }

    // Request any permission that isn't granted
    if (readStatus !== RESULTS.GRANTED) {
      const readResult = await request(PERMISSIONS.ANDROID.READ_SMS);
      if (readResult !== RESULTS.GRANTED) {
        console.warn('READ_SMS permission denied');
        return false;
      }
    }

    if (receiveStatus !== RESULTS.GRANTED) {
      const receiveResult = await request(PERMISSIONS.ANDROID.RECEIVE_SMS);
      if (receiveResult !== RESULTS.GRANTED) {
        console.warn('RECEIVE_SMS permission denied');
        return false;
      }
    }

    // Return true only if both permissions are granted
    return true;
  } catch (err) {
    console.error('Error requesting SMS permissions:', err);
    return false;
  }
};

export const readSMS = async (minDate, onSuccess, onError) => {
  try {
    const hasPermission = await requestSMSPermission();
    if (!hasPermission) {
      onError('SMS permission denied');
      return;
    }

    const filter = {
      box: 'inbox',
      minDate,
      bodyRegex: '(credited|debited|deposited|withdrawn|spent|received|transfer|payment)',
      address: BANK_SENDERS.join('|'),
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail) => {
        console.error('SMS reading failed:', fail);
        onError(fail);
      },
      (count, smsList) => {
        try {
          const messages = JSON.parse(smsList);
          console.log(`Successfully read ${count} SMS messages`);
          
          // Process messages and extract transaction data
          const transactions = messages
            .map(parseSMS)
            .filter(Boolean); // Remove null entries
          
          onSuccess(transactions);
        } catch (err) {
          console.error('Error parsing SMS:', err);
          onError(err);
        }
      }
    );
  } catch (err) {
    console.error('Error in readSMS:', err);
    onError(err);
  }
};
