
export const formatPhoneToInternational = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 10) return `+55${digits.slice(0, 2)}9${digits.slice(2)}`;
  return phone;
};
