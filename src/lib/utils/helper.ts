import { format } from 'date-fns';

export function formatAmount(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' vnđ';
}

export function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm:ss');
  } catch {
    return dateStr;
  }
}

export function maskPhone(phone: string) {
  if (phone.length <= 6) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}
