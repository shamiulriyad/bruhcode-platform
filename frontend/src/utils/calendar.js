function pad(n) { return String(n).padStart(2, '0'); }
function toGoogleDate(ts) {
  const d = new Date(ts);
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

export function createICS(contest) {
  const uid = `contest-${contest.id}-${Date.now()}`;
  const dtstamp = toGoogleDate(Date.now());
  const dtstart = toGoogleDate(contest.start);
  const dtend = toGoogleDate(contest.end);
  const summary = (contest.name || '').replace(/\n/g, ' ');
  const description = `Join: ${contest.url}`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BRUHCODE//Contest Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `URL:${contest.url}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  return ics;
}

export function downloadICS(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function openGoogleCalendar(contest) {
  const start = toGoogleDate(contest.start);
  const end = toGoogleDate(contest.end);
  const text = encodeURIComponent(contest.name || 'Contest');
  const details = encodeURIComponent(`Join: ${contest.url}`);
  const location = encodeURIComponent(contest.url || '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}&sf=true&output=xml`;
  window.open(url, '_blank');
}

export function addToCalendar(contest) {
  try {
    const ics = createICS(contest);
    downloadICS(ics, `${(contest.name || 'contest').replace(/[^a-z0-9]/gi,'_')}.ics`);
    openGoogleCalendar(contest);
  } catch (e) {
    console.error('Add to calendar failed', e);
    alert('Failed to add to calendar');
  }
}

const calendarUtils = { addToCalendar, createICS, downloadICS, openGoogleCalendar };

export default calendarUtils;
