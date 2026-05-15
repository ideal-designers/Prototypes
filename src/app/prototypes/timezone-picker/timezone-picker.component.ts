import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, DropdownOption } from '../../shared/ds';

const TIMEZONES_RAW = [
  { id: 'America/New_York',              city: 'New York',    region: 'Americas', offsetLabel: 'UTC−5',    aliases: ['Eastern', 'Toronto', 'Boston', 'Washington'] },
  { id: 'America/Chicago',               city: 'Chicago',     region: 'Americas', offsetLabel: 'UTC−6',    aliases: ['Central', 'Dallas', 'Houston', 'Mexico City'] },
  { id: 'America/Denver',                city: 'Denver',      region: 'Americas', offsetLabel: 'UTC−7',    aliases: ['Mountain', 'Phoenix', 'Salt Lake City'] },
  { id: 'America/Los_Angeles',           city: 'Los Angeles', region: 'Americas', offsetLabel: 'UTC−8',    aliases: ['Pacific', 'San Francisco', 'Seattle', 'Vancouver'] },
  { id: 'America/Anchorage',             city: 'Anchorage',   region: 'Americas', offsetLabel: 'UTC−9',    aliases: ['Alaska'] },
  { id: 'Pacific/Honolulu',              city: 'Honolulu',    region: 'Americas', offsetLabel: 'UTC−10',   aliases: ['Hawaii'] },
  { id: 'America/Sao_Paulo',             city: 'São Paulo',   region: 'Americas', offsetLabel: 'UTC−3',    aliases: ['Brazil', 'Rio', 'Brasilia'] },
  { id: 'America/Argentina/Buenos_Aires',city: 'Buenos Aires',region: 'Americas', offsetLabel: 'UTC−3',    aliases: ['Argentina'] },
  { id: 'America/Bogota',                city: 'Bogotá',      region: 'Americas', offsetLabel: 'UTC−5',    aliases: ['Colombia', 'Lima', 'Peru'] },
  { id: 'Europe/London',  city: 'London', region: 'Europe', offsetLabel: 'UTC±0',  aliases: ['UK', 'Dublin', 'Lisbon'] },
  { id: 'Europe/Paris',   city: 'Paris',  region: 'Europe', offsetLabel: 'UTC+1',  aliases: ['CET', 'Berlin', 'Rome', 'Madrid', 'Amsterdam', 'Brussels', 'Vienna', 'Stockholm'] },
  { id: 'Europe/Kyiv',    city: 'Kyiv',   region: 'Europe', offsetLabel: 'UTC+2',  aliases: ['Ukraine', 'Kiev', 'EET', 'Helsinki', 'Riga', 'Tallinn', 'Vilnius'], detected: true },
  { id: 'Europe/Moscow',  city: 'Moscow', region: 'Europe', offsetLabel: 'UTC+3',  aliases: ['Russia', 'Istanbul', 'Minsk'] },
  { id: 'Europe/Athens',  city: 'Athens', region: 'Europe', offsetLabel: 'UTC+2',  aliases: ['Greece', 'Bucharest', 'Sofia'] },
  { id: 'Europe/Warsaw',  city: 'Warsaw', region: 'Europe', offsetLabel: 'UTC+1',  aliases: ['Poland', 'Prague', 'Budapest', 'Bratislava'] },
  { id: 'Asia/Dubai',      city: 'Dubai',     region: 'Asia', offsetLabel: 'UTC+4',    aliases: ['UAE', 'Abu Dhabi', 'Muscat', 'Tbilisi', 'Yerevan'] },
  { id: 'Asia/Kolkata',    city: 'Kolkata',   region: 'Asia', offsetLabel: 'UTC+5:30', aliases: ['India', 'Mumbai', 'New Delhi', 'Bangalore', 'IST'] },
  { id: 'Asia/Dhaka',      city: 'Dhaka',     region: 'Asia', offsetLabel: 'UTC+6',    aliases: ['Bangladesh', 'Almaty'] },
  { id: 'Asia/Bangkok',    city: 'Bangkok',   region: 'Asia', offsetLabel: 'UTC+7',    aliases: ['Thailand', 'Hanoi', 'Jakarta', 'Ho Chi Minh'] },
  { id: 'Asia/Singapore',  city: 'Singapore', region: 'Asia', offsetLabel: 'UTC+8',    aliases: ['SGT', 'Kuala Lumpur', 'Beijing', 'Shanghai', 'Hong Kong', 'Taipei'] },
  { id: 'Asia/Tokyo',      city: 'Tokyo',     region: 'Asia', offsetLabel: 'UTC+9',    aliases: ['Japan', 'Seoul', 'Osaka'] },
  { id: 'Australia/Sydney',city: 'Sydney',    region: 'Asia', offsetLabel: 'UTC+10',   aliases: ['Australia', 'Melbourne', 'Brisbane'] },
  { id: 'Pacific/Auckland',city: 'Auckland',  region: 'Asia', offsetLabel: 'UTC+12',   aliases: ['New Zealand'] },
  { id: 'Africa/Johannesburg', city: 'Johannesburg', region: 'Africa', offsetLabel: 'UTC+2', aliases: ['South Africa', 'Harare', 'Nairobi'] },
  { id: 'Africa/Lagos',        city: 'Lagos',         region: 'Africa', offsetLabel: 'UTC+1', aliases: ['Nigeria', 'West Africa', 'Kinshasa'] },
  { id: 'Africa/Cairo',        city: 'Cairo',         region: 'Africa', offsetLabel: 'UTC+2', aliases: ['Egypt'] },
  { id: 'Asia/Riyadh',         city: 'Riyadh',        region: 'Africa', offsetLabel: 'UTC+3', aliases: ['Saudi Arabia', 'Kuwait', 'Bahrain', 'Baghdad'] },
  { id: 'Asia/Tehran',         city: 'Tehran',        region: 'Africa', offsetLabel: 'UTC+3:30', aliases: ['Iran'] },
];

const DETECTED = TIMEZONES_RAW.find(t => (t as any).detected)!;

const TIMEZONE_OPTIONS: DropdownOption[] = TIMEZONES_RAW.map(tz => ({
  value: tz.id,
  label: tz.city,
  sublabel: tz.offsetLabel,
  group: tz.region,
  aliases: tz.aliases,
  badge: (tz as any).detected ? 'Your location' : undefined,
}));

@Component({
  selector: 'app-timezone-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
<div class="page">
  <main class="main">
    <div class="page-header">
      <h1 class="page-title">Timezone selector</h1>
    </div>

    <div class="card">
      <fvdr-dropdown
        label="Time zone"
        [options]="timezoneOptions"
        [(ngModel)]="selectedTimezone"
        [searchable]="true"
        searchPlaceholder="Search by city or timezone…"
        detectAutoLabel="Auto-detected"
        [detectAutoSublabel]="detectedSublabel"
        detectAutoValue="Europe/Kyiv"
        [showCurrentTime]="true"
        [panelMaxHeight]="300"
        helperText="Determines when email notifications about documents and report subscriptions are sent out, and time displayed in data room"
        (autoDetected)="onAutoDetected()"
      />
    </div>

    <div class="changes">
      <div class="changes__title">Що змінено в fvdr-dropdown</div>
      <div class="changes__list">
        <div class="change" *ngFor="let c of changes">
          <span class="change__dot"></span>
          <div>
            <strong>{{ c.title }}</strong>
            <span>{{ c.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family, 'Inter', sans-serif); }
    .page { display: flex; height: 100vh; background: var(--color-stone-200); justify-content: center; }

    .main {
      width: 100%; max-width: 480px; overflow-y: auto; padding: var(--space-8);
      display: flex; flex-direction: column; gap: var(--space-6);
    }
    .page-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

    .card {
      background: var(--color-stone-0); border-radius: var(--radius-lg);
      border: 1px solid var(--color-divider); padding: var(--space-5);
    }

    .changes {
      background: var(--color-stone-0); border-radius: var(--radius-lg);
      border: 1px solid var(--color-divider); padding: var(--space-5);
    }
    .changes__title {
      font-size: 13px; font-weight: 600; color: var(--color-text-primary);
      margin-bottom: var(--space-4);
    }
    .changes__list { display: flex; flex-direction: column; gap: var(--space-3); }
    .change {
      display: flex; gap: var(--space-3); align-items: flex-start;
      font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;
    }
    .change__dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--color-primary-500); flex-shrink: 0; margin-top: 6px;
    }
    .change strong { color: var(--color-text-primary); font-weight: 600; margin-right: 4px; }
  `],
})
export class TimezonePickerComponent implements OnInit {
  timezoneOptions: DropdownOption[] = TIMEZONE_OPTIONS;
  selectedTimezone = '';
  detectedSublabel = `${DETECTED.city} · ${DETECTED.offsetLabel}`;

  changes = [
    { title: 'sublabel',        desc: 'UTC offset вирівняний вправо в кожному рядку списку' },
    { title: 'aliases',         desc: 'Пошук по синонімах — Kiev знайде Kyiv, Pacific → Los Angeles' },
    { title: 'badge',           desc: 'Мітка "Your location" на виявленому рядку' },
    { title: 'detectAutoLabel', desc: 'Рядок "Detect automatically" під пошуком зі станом Auto' },
    { title: 'showCurrentTime', desc: 'Живий час у тригері через Intl.DateTimeFormat' },
    { title: 'searchPlaceholder', desc: 'Кастомний placeholder для поля пошуку' },
    { title: 'panelMaxHeight',  desc: 'Висота списку в px, для timezone — 300' },
    { title: '(autoDetected)',  desc: 'Івент при виборі "Detect automatically"' },
  ];

  ngOnInit() {}
  onAutoDetected() { this.selectedTimezone = DETECTED.id; }
}
