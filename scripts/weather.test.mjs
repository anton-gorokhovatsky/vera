import test from 'node:test';
import assert from 'node:assert/strict';
import {moscowClock,currentForecast,skyState} from '../site/weather-model.js';
const at = '2026-09-30T08:00:00Z';
const point = (time, temperature = 14) => ({time,data:{instant:{details:{air_temperature:temperature,cloud_area_fraction:82,wind_speed:3}},next_1_hours:{summary:{symbol_code:'cloudy'}}}});
const payload = {properties:{meta:{updated_at:'2026-09-30T07:00:00Z'},timeseries:[point(at),point('2026-09-30T09:00:00Z',15)]}};
test('Moscow date boundary is independent of the visitor timezone',()=>assert.equal(moscowClock(new Date('2026-09-30T22:05:00Z')),'01:05'));
test('Uses the exact forecast hour rather than a later point',()=>assert.equal(currentForecast(payload,Date.parse(at)).temperature,14));
test('Rejects stale and malformed weather instead of presenting invented current conditions',()=>{
  assert.equal(currentForecast(payload,Date.parse('2026-10-01T10:00:00Z')),null);
  assert.equal(currentForecast({},Date.parse(at)),null);
  assert.equal(currentForecast({properties:{meta:payload.properties.meta,timeseries:[]}},Date.parse(at)),null);
});
test('Weather changes the daylight palette; Moscow night remains dark',()=>{
  assert.equal(skyState(new Date(at),{cloud:80,symbol:'cloudy'}),'cloud');
  assert.equal(skyState(new Date(at),{cloud:80,symbol:'rain'}),'rain');
  assert.equal(skyState(new Date(at),{cloud:80,symbol:'snow'}),'snow');
  assert.equal(skyState(new Date('2026-09-30T20:00:00Z'),{cloud:80,symbol:'rain'}),'night');
  assert.equal(skyState(new Date(at),null),'day');
});
