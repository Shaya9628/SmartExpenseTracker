const BANK_PATTERNS = [
  {
    name: 'HDFC',
    patterns: {
      debit: [
        /(?:spent|debited|paid)\s+(?:Rs\.|INR|Rs|₹)\s*([0-9,.]+).*?(?:at|to|in)\s+(.*?)(?:on|\.|\bon\s+(\d{2}(?:\/|-)\d{2}(?:\/|-)\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}))?/i,
      ],
      credit: [
        /(?:credited|received|deposited)\s+(?:Rs\.|INR|Rs|₹)\s*([0-9,.]+).*?(?:from|by)\s+(.*?)(?:on|\.|\bon\s+(\d{2}(?:\/|-)\d{2}(?:\/|-)\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}))?/i,
      ],
    },
  },
  // Add more banks and patterns as needed
];

export const parseSMS = (message) => {
  for (const bank of BANK_PATTERNS) {
    // Check for debits
    for (const pattern of bank.patterns.debit) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'DEBIT',
          amount: parseFloat(match[1].replace(/[,]/g, '')),
          date: match[3] ? new Date(match[3]) : new Date(),
          bankName: bank.name,
          description: match[2].trim(),
          raw: message,
        };
      }
    }

    // Check for credits
    for (const pattern of bank.patterns.credit) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'CREDIT',
          amount: parseFloat(match[1].replace(/[,]/g, '')),
          date: match[3] ? new Date(match[3]) : new Date(),
          bankName: bank.name,
          description: match[2].trim(),
          raw: message,
        };
      }
    }
  }

  return null;
};

export const isFinancialSMS = (message) => {
  const keywords = [
    'debit',
    'credit',
    'spent',
    'received',
    'transaction',
    'account',
    'balance',
    'payment',
    'upi',
    'bank',
    'atm',
    'transfer',
  ];
  const pattern = new RegExp(keywords.join('|'), 'i');
  return pattern.test(message);
};
