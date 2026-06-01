import { format, isToday, isTomorrow, parseISO } from 'date-fns';

export function formatTime(iso) {
  return format(parseISO(iso), 'HH:mm');
}

export function formatDate(iso) {
  const d = parseISO(iso);
  if (isToday(d))    return `Today, ${format(d, 'd MMM')}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, 'd MMM')}`;
  return format(d, 'EEE d MMM yyyy');
}

export function formatDateTime(iso) {
  return format(parseISO(iso), 'EEE d MMM · HH:mm');
}

export function formatPrice(val) {
  return `${Number(val).toFixed(0)} RSD`;
}

export function toDateString(date) {
  return format(date, 'yyyy-MM-dd');
}

export function statusColor(status) {
  switch (status) {
    case 'confirmed':  return { bg: '#e8f5e9', text: '#2e7d32', dot: '#43a047' };
    case 'pending':    return { bg: '#fff8e1', text: '#f57f17', dot: '#ffb300' };
    case 'no_show':    return { bg: '#fce7f3', text: '#9d174d', dot: '#db2777' };
    case 'cancelled':  return { bg: '#f5f5f5', text: '#757575', dot: '#9e9e9e' };
    default:           return { bg: '#fff0f5', text: '#72243E', dot: '#d4537e' };
  }
}
