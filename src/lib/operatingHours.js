/**
 * Holy Buds Operating Hours & Weekend Schedule Engine
 * Timezone: America/New_York (Long Island, NY)
 */

export const STORE_TIMEZONE = 'America/New_York';
export const HOURS_WEEKDAY = 'Sun-Thu: 10 AM – 10 PM';
export const HOURS_WEEKEND = 'Fri-Sat: 10 AM – 12 AM';

/**
 * Returns current store status relative to America/New_York local time.
 * - Weekday (Sun–Thu): 10:00 AM – 10:00 PM (10:00 - 22:00)
 * - Weekend (Fri–Sat): 10:00 AM – 12:00 AM (10:00 - 24:00)
 */
export function getStoreHoursStatus(currentDate = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: STORE_TIMEZONE,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(currentDate);
    const day = parts.find((p) => p.type === 'weekday')?.value || '';
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const timeInHours = hour + minute / 60;

    const isWeekend = day === 'Fri' || day === 'Sat';
    const closeHour = isWeekend ? 24 : 22;
    const isOpen = timeInHours >= 10 && timeInHours < closeHour;

    return {
      isWeekend,
      isOpen,
      day,
      closeTimeText: isWeekend ? '12 AM' : '10 PM',
      currentSchedule: isWeekend ? HOURS_WEEKEND : HOURS_WEEKDAY,
      allHoursText: `${HOURS_WEEKDAY} | ${HOURS_WEEKEND}`,
      badgeText: isWeekend ? 'Open Late Tonight till 12 AM' : 'Open Today till 10 PM',
      bannerHeadline: "It's The Weekend — We're Open Late!",
      bannerSubtext: 'Fri-Sat: 10 AM – 12 AM (Midnight) | Sun-Thu: 10 AM – 10 PM',
    };
  } catch (err) {
    const d = currentDate || new Date();
    const dayIdx = d.getDay();
    const isWeekend = dayIdx === 5 || dayIdx === 6;
    return {
      isWeekend,
      isOpen: true,
      day: isWeekend ? 'Fri' : 'Sun',
      closeTimeText: isWeekend ? '12 AM' : '10 PM',
      currentSchedule: isWeekend ? HOURS_WEEKEND : HOURS_WEEKDAY,
      allHoursText: `${HOURS_WEEKDAY} | ${HOURS_WEEKEND}`,
      badgeText: isWeekend ? 'Open Late Tonight till 12 AM' : 'Open Today till 10 PM',
      bannerHeadline: "It's The Weekend — We're Open Late!",
      bannerSubtext: 'Fri-Sat: 10 AM – 12 AM (Midnight) | Sun-Thu: 10 AM – 10 PM',
    };
  }
}

