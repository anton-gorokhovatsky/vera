// Fixed Moscow coordinates: no visitor location is requested.
export const MOSCOW = {lat:55.7558, lon:37.6173, zone:'Europe/Moscow'};
export function moscowClock(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {timeZone:MOSCOW.zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);
}
export function currentForecast(payload, now = Date.now()) {
  const updated = Date.parse(payload?.properties?.meta?.updated_at);
  if (!Number.isFinite(updated) || now - updated > 8 * 3600000 || updated > now + 3600000) return null;
  const series = payload?.properties?.timeseries;
  if (!Array.isArray(series)) return null;
  const item = series.reduce((best, point) => Math.abs(Date.parse(point.time)-now) < (best ? Math.abs(Date.parse(best.time)-now) : Infinity) ? point : best, null);
  if (!item || Math.abs(Date.parse(item.time)-now) > 90*60000) return null;
  const d = item.data?.instant?.details;
  if (!Number.isFinite(d?.air_temperature) || !Number.isFinite(d?.cloud_area_fraction)) return null;
  return {temperature:d.air_temperature,cloud:d.cloud_area_fraction,wind:d.wind_speed || 0,symbol:item.data?.next_1_hours?.summary?.symbol_code || item.data?.next_6_hours?.summary?.symbol_code || '',time:item.time};
}
export function skyState(date = new Date(), forecast = null) {
  const hour = Number(moscowClock(date).slice(0,2));
  // Broad local-time bands; the forecast's day/night signal refines the evening.
  const symbol = forecast?.symbol || '';
  if (hour < 6 || hour >= 21 || (symbol.endsWith('_night') && (hour < 7 || hour >= 19))) return 'night';
  if (hour >= 18) return 'dusk';
  if (hour < 9) return 'dawn';
  if (/snow|sleet/.test(symbol)) return 'snow';
  if (/rain|thunder/.test(symbol)) return 'rain';
  if ((forecast?.cloud ?? 0) >= 65 || /fog/.test(symbol)) return 'cloud';
  return 'day';
}
