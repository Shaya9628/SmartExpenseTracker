import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import SmsAndroid from 'react-native-get-sms-android';

const BANK_SENDERS = ['HDFCBK', 'ICICIB', 'SBIINB', 'AXISBK', 'BOIIND', 'CENTBK', 'YESBNK', 'KOTAKB'];

const BANK_PATTERNS = {
  HDFC: /HDFC Bank: (Rs\.|INR) ([\d,]+\.?\d*) (credited to|debited from) your (a\/c|account) (\w+) on (\d{2}-\d{2}-\d{2})/i,
  ICICI: /ICICI Bank (A\/c|Account) (\w+) (credited|debited) with (Rs\.|INR) ([\d,]+\.?\d*) on (\d{2}-\d{2}-\d{2})/i,
  SBI: /SBI (A\/c|Account) (\w+) (credited|debited) with (Rs\.|INR) ([\d,]+\.?\d*) on (\d{2}-\d{2}-\d{2})/i,
  AXIS: /Axis Bank (A\/c|Account) (\w+) (credited|debited) (Rs\.|INR) ([\d,]+\.?\d*) on (\d{2}-\d{2}-\d{2})/i,
  BOI: /BOI: (Rs\.|INR) ([\d,]+\.?\d*) (credited to|debited from) (A\/c|Account) (\w+) on (\d{2}-\d{2}-\d{2})/i,
  YESBANK: /YES BANK.*?(Rs\.|INR) ([\d,]+\.?\d*).*(credited|debited).*?A\/c\s?(\w+)/i,
  KOTAK: /Kotak.*?(credited|debited).*?(Rs\.|INR) ([\d,]+\.?\d*).*?A\/c\s?(\w+)/i,
};

const CATEGORIES = {
  FOOD: ['swiggy', 'zomato', 'restaurant', 'food', 'dining', 'eatery'],
  SHOPPING: ['amazon', 'flipkart', 'myntra', 'shopping', 'lifestyle'],
  TRANSPORT: ['uber', 'ola', 'metro', 'petrol', 'fuel', 'cab', 'diesel'],
  BILLS: ['electricity', 'water', 'gas', 'mobile', 'broadband', 'postpaid', 'prepaid'],
  ENTERTAINMENT: ['netflix', 'prime', 'hotstar', 'movie', 'bookmyshow'],
  HEALTH: ['hospital', 'medical', 'pharmacy', 'doctor', 'clinic'],
  OTHERS: [],
};

const detectCategory = (description) => {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some((word) => lower.includes(word))) return category;
  }
  return 'OTHERS';
};

const detectBank = (sender, body) => {
  for (const bank in BANK_PATTERNS) {
    if (sender.toUpperCase().includes(bank) || body.toUpperCase().includes(bank)) {
      return bank;
    }
  }
  return 'UNKNOWN';
};

const parseSMS = (sms) => {
  const { address, body, date } = sms;
  const bank = detectBank(address, body);
  const pattern = BANK_PATTERNS[bank];

  if (!pattern) return null;

  const match = body.match(pattern);
  if (!match) return null;

  const amount = parseFloat(match[2].replace(/,/g, ''));
  const type = /credit/i.test(match[3]) ? 'CREDIT' : 'DEBIT';
  const account = match[5] || 'Unknown';

  return {
    type,
    amount,
    date: new Date(parseInt(date)).toISOString(),
    description: body,
    category: detectCategory(body),
    bank,
    account,
    rawSms: body,
  };
};

export const requestSMSPermission = async () => {
  try {
    const readStatus = await check(PERMISSIONS.ANDROID.READ_SMS);
    const receiveStatus = await check(PERMISSIONS.ANDROID.RECEIVE_SMS);

    if (readStatus === RESULTS.GRANTED && receiveStatus === RESULTS.GRANTED) return true;

    if (readStatus !== RESULTS.GRANTED) {
      const res = await request(PERMISSIONS.ANDROID.READ_SMS);
      if (res !== RESULTS.GRANTED) return false;
    }

    if (receiveStatus !== RESULTS.GRANTED) {
      const res = await request(PERMISSIONS.ANDROID.RECEIVE_SMS);
      if (res !== RESULTS.GRANTED) return false;
    }

    return true;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

export const readSMS = async (minDate, onSuccess, onError) => {
  try {
    if (Platform.OS !== 'android') {
      onError('SMS reading not supported on iOS');
      return;
    }

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
        console.error('SMS fetch error:', fail);
        onError(fail);
      },
      (count, smsList) => {
        try {
          const messages = JSON.parse(smsList);
          console.log(`✅ Found ${count} SMS messages`);
          const transactions = messages.map(parseSMS).filter(Boolean);
          console.log('✅ Parsed transactions:', transactions.length);
          onSuccess(transactions);
        } catch (err) {
          console.error('Parsing error:', err);
          onError(err);
        }
      }
    );
  } catch (err) {
    console.error('readSMS exception:', err);
    onError(err);
  }
};
