// iOS doesn't provide SMS access API
export const requestSMSPermission = async () => {
  console.warn('SMS permission is not available on iOS');
  return false;
};

export const readSMS = async () => {
  console.warn('SMS reading is not available on iOS');
  return [];
};
