import {MOSCOW, moscowClock, currentForecast, skyState} from './weather-model.js';
const root = document.documentElement;
const chinese = root.lang.startsWith('zh');
const clock = document.querySelector('[data-moscow-clock]');
const reading = document.querySelector('[data-weather-reading]');
const symbol = document.querySelector('.weather-symbol');
const attribution = document.querySelector('.weather-source');
const storageKey = 'vera-moscow-weather-v1';
const endpoint = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${MOSCOW.lat}&lon=${MOSCOW.lon}`;
let cache;
let fetching = false;
let retryAfter = 0;
try { cache = JSON.parse(localStorage.getItem(storageKey)); } catch {}
function renderSky() {
  const date = new Date();
  const forecast = currentForecast(cache?.data, date.getTime());
  const sky = skyState(date, forecast);
  root.dataset.sky = sky;
  clock.textContent = `${chinese ? '莫斯科' : 'Москва'} ${moscowClock(date)}`;
  symbol.textContent = sky === 'night' ? '◔' : /rain|cloud|snow/.test(sky) ? '◒' : '☀';
  if (forecast) {
    const names = chinese ? {rain:'雨',snow:'雪',cloud:'多云',fair:'晴间多云',day:'晴',dawn:'清晨',dusk:'傍晚',night:'夜间'} : {rain:'дождь',snow:'снег',cloud:'облачно',fair:'малооблачно',day:'ясно',dawn:'утро',dusk:'вечер',night:'ночь'};
    // Conditions remain distinct from the colour/time mode.
    const condition = /snow|sleet/.test(forecast.symbol) ? 'snow' : /rain|thunder/.test(forecast.symbol) ? 'rain' : forecast.cloud >= 65 ? 'cloud' : forecast.cloud >= 15 ? 'fair' : 'day';
    reading.textContent = `${Math.round(forecast.temperature)}° · ${names[condition]}`;
    reading.title = `${chinese ? '逐小时预报' : 'Почасовой прогноз'} · MET Norway · ${moscowClock(new Date(forecast.time))}`;
    attribution.hidden = false;
  } else { reading.textContent = ''; attribution.hidden = true; }
}
async function refreshWeather() {
  if (document.hidden || fetching || Date.now() < retryAfter) return;
  if (cache?.fetchedAt && Date.now() - cache.fetchedAt < 3600000) return;
  fetching = true;
  retryAfter = Date.now() + 3600000;
  try {
    // Simple CORS request; Origin identifies this small static site to MET Norway.
    const response = await fetch(endpoint, {credentials:'omit',signal:AbortSignal.timeout(7000)});
    if (!response.ok) throw new Error('Weather unavailable');
    const data = await response.json();
    if (!currentForecast(data)) throw new Error('Forecast is stale');
    cache = {data,fetchedAt:Date.now()};
    try { localStorage.setItem(storageKey, JSON.stringify(cache)); } catch {}
    renderSky();
  } catch { /* Time-driven palette stays available without weather. */ }
  finally { fetching = false; }
}
renderSky();
refreshWeather();
setInterval(() => { if (!document.hidden) { renderSky(); refreshWeather(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderSky(); refreshWeather(); } });
