import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

export interface PhoneCountry {
  code: string;   // '+1'
  iso: string;    // 'US'
  flag: string;   // '🇺🇸'
  name: string;
}

/**
 * Full list of world countries (ITU calling codes) with flag emojis.
 * Russia (RU/+7) and North Korea (KP/+850) are intentionally excluded.
 */
const DEFAULT_COUNTRIES: PhoneCountry[] = [
  { code: '+93',   iso: 'AF', flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+355',  iso: 'AL', flag: '🇦🇱', name: 'Albania' },
  { code: '+213',  iso: 'DZ', flag: '🇩🇿', name: 'Algeria' },
  { code: '+1684', iso: 'AS', flag: '🇦🇸', name: 'American Samoa' },
  { code: '+376',  iso: 'AD', flag: '🇦🇩', name: 'Andorra' },
  { code: '+244',  iso: 'AO', flag: '🇦🇴', name: 'Angola' },
  { code: '+1264', iso: 'AI', flag: '🇦🇮', name: 'Anguilla' },
  { code: '+1268', iso: 'AG', flag: '🇦🇬', name: 'Antigua and Barbuda' },
  { code: '+54',   iso: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+374',  iso: 'AM', flag: '🇦🇲', name: 'Armenia' },
  { code: '+297',  iso: 'AW', flag: '🇦🇼', name: 'Aruba' },
  { code: '+61',   iso: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+43',   iso: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+994',  iso: 'AZ', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+1242', iso: 'BS', flag: '🇧🇸', name: 'Bahamas' },
  { code: '+973',  iso: 'BH', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+880',  iso: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+1246', iso: 'BB', flag: '🇧🇧', name: 'Barbados' },
  { code: '+375',  iso: 'BY', flag: '🇧🇾', name: 'Belarus' },
  { code: '+32',   iso: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+501',  iso: 'BZ', flag: '🇧🇿', name: 'Belize' },
  { code: '+229',  iso: 'BJ', flag: '🇧🇯', name: 'Benin' },
  { code: '+1441', iso: 'BM', flag: '🇧🇲', name: 'Bermuda' },
  { code: '+975',  iso: 'BT', flag: '🇧🇹', name: 'Bhutan' },
  { code: '+591',  iso: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+387',  iso: 'BA', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
  { code: '+267',  iso: 'BW', flag: '🇧🇼', name: 'Botswana' },
  { code: '+55',   iso: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+246',  iso: 'IO', flag: '🇮🇴', name: 'British Indian Ocean Territory' },
  { code: '+1284', iso: 'VG', flag: '🇻🇬', name: 'British Virgin Islands' },
  { code: '+673',  iso: 'BN', flag: '🇧🇳', name: 'Brunei' },
  { code: '+359',  iso: 'BG', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+226',  iso: 'BF', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+257',  iso: 'BI', flag: '🇧🇮', name: 'Burundi' },
  { code: '+855',  iso: 'KH', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+237',  iso: 'CM', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+1',    iso: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+238',  iso: 'CV', flag: '🇨🇻', name: 'Cape Verde' },
  { code: '+1345', iso: 'KY', flag: '🇰🇾', name: 'Cayman Islands' },
  { code: '+236',  iso: 'CF', flag: '🇨🇫', name: 'Central African Republic' },
  { code: '+235',  iso: 'TD', flag: '🇹🇩', name: 'Chad' },
  { code: '+56',   iso: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+86',   iso: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+57',   iso: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+269',  iso: 'KM', flag: '🇰🇲', name: 'Comoros' },
  { code: '+242',  iso: 'CG', flag: '🇨🇬', name: 'Congo' },
  { code: '+243',  iso: 'CD', flag: '🇨🇩', name: 'Congo (DRC)' },
  { code: '+682',  iso: 'CK', flag: '🇨🇰', name: 'Cook Islands' },
  { code: '+506',  iso: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+225',  iso: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+385',  iso: 'HR', flag: '🇭🇷', name: 'Croatia' },
  { code: '+53',   iso: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+599',  iso: 'CW', flag: '🇨🇼', name: 'Curaçao' },
  { code: '+357',  iso: 'CY', flag: '🇨🇾', name: 'Cyprus' },
  { code: '+420',  iso: 'CZ', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+45',   iso: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+253',  iso: 'DJ', flag: '🇩🇯', name: 'Djibouti' },
  { code: '+1767', iso: 'DM', flag: '🇩🇲', name: 'Dominica' },
  { code: '+1809', iso: 'DO', flag: '🇩🇴', name: 'Dominican Republic' },
  { code: '+593',  iso: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+20',   iso: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+503',  iso: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+240',  iso: 'GQ', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { code: '+291',  iso: 'ER', flag: '🇪🇷', name: 'Eritrea' },
  { code: '+372',  iso: 'EE', flag: '🇪🇪', name: 'Estonia' },
  { code: '+268',  iso: 'SZ', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+251',  iso: 'ET', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+500',  iso: 'FK', flag: '🇫🇰', name: 'Falkland Islands' },
  { code: '+298',  iso: 'FO', flag: '🇫🇴', name: 'Faroe Islands' },
  { code: '+679',  iso: 'FJ', flag: '🇫🇯', name: 'Fiji' },
  { code: '+358',  iso: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+33',   iso: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+594',  iso: 'GF', flag: '🇬🇫', name: 'French Guiana' },
  { code: '+689',  iso: 'PF', flag: '🇵🇫', name: 'French Polynesia' },
  { code: '+241',  iso: 'GA', flag: '🇬🇦', name: 'Gabon' },
  { code: '+220',  iso: 'GM', flag: '🇬🇲', name: 'Gambia' },
  { code: '+995',  iso: 'GE', flag: '🇬🇪', name: 'Georgia' },
  { code: '+49',   iso: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+233',  iso: 'GH', flag: '🇬🇭', name: 'Ghana' },
  { code: '+350',  iso: 'GI', flag: '🇬🇮', name: 'Gibraltar' },
  { code: '+30',   iso: 'GR', flag: '🇬🇷', name: 'Greece' },
  { code: '+299',  iso: 'GL', flag: '🇬🇱', name: 'Greenland' },
  { code: '+1473', iso: 'GD', flag: '🇬🇩', name: 'Grenada' },
  { code: '+590',  iso: 'GP', flag: '🇬🇵', name: 'Guadeloupe' },
  { code: '+1671', iso: 'GU', flag: '🇬🇺', name: 'Guam' },
  { code: '+502',  iso: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+44',   iso: 'GG', flag: '🇬🇬', name: 'Guernsey' },
  { code: '+224',  iso: 'GN', flag: '🇬🇳', name: 'Guinea' },
  { code: '+245',  iso: 'GW', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: '+592',  iso: 'GY', flag: '🇬🇾', name: 'Guyana' },
  { code: '+509',  iso: 'HT', flag: '🇭🇹', name: 'Haiti' },
  { code: '+504',  iso: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+852',  iso: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+36',   iso: 'HU', flag: '🇭🇺', name: 'Hungary' },
  { code: '+354',  iso: 'IS', flag: '🇮🇸', name: 'Iceland' },
  { code: '+91',   iso: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+62',   iso: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+98',   iso: 'IR', flag: '🇮🇷', name: 'Iran' },
  { code: '+964',  iso: 'IQ', flag: '🇮🇶', name: 'Iraq' },
  { code: '+353',  iso: 'IE', flag: '🇮🇪', name: 'Ireland' },
  { code: '+44',   iso: 'IM', flag: '🇮🇲', name: 'Isle of Man' },
  { code: '+972',  iso: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '+39',   iso: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+1876', iso: 'JM', flag: '🇯🇲', name: 'Jamaica' },
  { code: '+81',   iso: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+44',   iso: 'JE', flag: '🇯🇪', name: 'Jersey' },
  { code: '+962',  iso: 'JO', flag: '🇯🇴', name: 'Jordan' },
  { code: '+7',    iso: 'KZ', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '+254',  iso: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+686',  iso: 'KI', flag: '🇰🇮', name: 'Kiribati' },
  { code: '+383',  iso: 'XK', flag: '🇽🇰', name: 'Kosovo' },
  { code: '+965',  iso: 'KW', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+996',  iso: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '+856',  iso: 'LA', flag: '🇱🇦', name: 'Laos' },
  { code: '+371',  iso: 'LV', flag: '🇱🇻', name: 'Latvia' },
  { code: '+961',  iso: 'LB', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+266',  iso: 'LS', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+231',  iso: 'LR', flag: '🇱🇷', name: 'Liberia' },
  { code: '+218',  iso: 'LY', flag: '🇱🇾', name: 'Libya' },
  { code: '+423',  iso: 'LI', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: '+370',  iso: 'LT', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+352',  iso: 'LU', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+853',  iso: 'MO', flag: '🇲🇴', name: 'Macao' },
  { code: '+261',  iso: 'MG', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+265',  iso: 'MW', flag: '🇲🇼', name: 'Malawi' },
  { code: '+60',   iso: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+960',  iso: 'MV', flag: '🇲🇻', name: 'Maldives' },
  { code: '+223',  iso: 'ML', flag: '🇲🇱', name: 'Mali' },
  { code: '+356',  iso: 'MT', flag: '🇲🇹', name: 'Malta' },
  { code: '+692',  iso: 'MH', flag: '🇲🇭', name: 'Marshall Islands' },
  { code: '+596',  iso: 'MQ', flag: '🇲🇶', name: 'Martinique' },
  { code: '+222',  iso: 'MR', flag: '🇲🇷', name: 'Mauritania' },
  { code: '+230',  iso: 'MU', flag: '🇲🇺', name: 'Mauritius' },
  { code: '+262',  iso: 'YT', flag: '🇾🇹', name: 'Mayotte' },
  { code: '+52',   iso: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+691',  iso: 'FM', flag: '🇫🇲', name: 'Micronesia' },
  { code: '+373',  iso: 'MD', flag: '🇲🇩', name: 'Moldova' },
  { code: '+377',  iso: 'MC', flag: '🇲🇨', name: 'Monaco' },
  { code: '+976',  iso: 'MN', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+382',  iso: 'ME', flag: '🇲🇪', name: 'Montenegro' },
  { code: '+1664', iso: 'MS', flag: '🇲🇸', name: 'Montserrat' },
  { code: '+212',  iso: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '+258',  iso: 'MZ', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+95',   iso: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  { code: '+264',  iso: 'NA', flag: '🇳🇦', name: 'Namibia' },
  { code: '+674',  iso: 'NR', flag: '🇳🇷', name: 'Nauru' },
  { code: '+977',  iso: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+31',   iso: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+687',  iso: 'NC', flag: '🇳🇨', name: 'New Caledonia' },
  { code: '+64',   iso: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+505',  iso: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+227',  iso: 'NE', flag: '🇳🇪', name: 'Niger' },
  { code: '+234',  iso: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+683',  iso: 'NU', flag: '🇳🇺', name: 'Niue' },
  { code: '+389',  iso: 'MK', flag: '🇲🇰', name: 'North Macedonia' },
  { code: '+1670', iso: 'MP', flag: '🇲🇵', name: 'Northern Mariana Islands' },
  { code: '+47',   iso: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+968',  iso: 'OM', flag: '🇴🇲', name: 'Oman' },
  { code: '+92',   iso: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+680',  iso: 'PW', flag: '🇵🇼', name: 'Palau' },
  { code: '+970',  iso: 'PS', flag: '🇵🇸', name: 'Palestine' },
  { code: '+507',  iso: 'PA', flag: '🇵🇦', name: 'Panama' },
  { code: '+675',  iso: 'PG', flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: '+595',  iso: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+51',   iso: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: '+63',   iso: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+48',   iso: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+351',  iso: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+1787', iso: 'PR', flag: '🇵🇷', name: 'Puerto Rico' },
  { code: '+974',  iso: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: '+262',  iso: 'RE', flag: '🇷🇪', name: 'Réunion' },
  { code: '+40',   iso: 'RO', flag: '🇷🇴', name: 'Romania' },
  { code: '+250',  iso: 'RW', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+590',  iso: 'BL', flag: '🇧🇱', name: 'Saint Barthélemy' },
  { code: '+290',  iso: 'SH', flag: '🇸🇭', name: 'Saint Helena' },
  { code: '+1869', iso: 'KN', flag: '🇰🇳', name: 'Saint Kitts and Nevis' },
  { code: '+1758', iso: 'LC', flag: '🇱🇨', name: 'Saint Lucia' },
  { code: '+590',  iso: 'MF', flag: '🇲🇫', name: 'Saint Martin' },
  { code: '+508',  iso: 'PM', flag: '🇵🇲', name: 'Saint Pierre and Miquelon' },
  { code: '+1784', iso: 'VC', flag: '🇻🇨', name: 'Saint Vincent and the Grenadines' },
  { code: '+685',  iso: 'WS', flag: '🇼🇸', name: 'Samoa' },
  { code: '+378',  iso: 'SM', flag: '🇸🇲', name: 'San Marino' },
  { code: '+239',  iso: 'ST', flag: '🇸🇹', name: 'São Tomé and Príncipe' },
  { code: '+966',  iso: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+221',  iso: 'SN', flag: '🇸🇳', name: 'Senegal' },
  { code: '+381',  iso: 'RS', flag: '🇷🇸', name: 'Serbia' },
  { code: '+248',  iso: 'SC', flag: '🇸🇨', name: 'Seychelles' },
  { code: '+232',  iso: 'SL', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: '+65',   iso: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+1721', iso: 'SX', flag: '🇸🇽', name: 'Sint Maarten' },
  { code: '+421',  iso: 'SK', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+386',  iso: 'SI', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+677',  iso: 'SB', flag: '🇸🇧', name: 'Solomon Islands' },
  { code: '+252',  iso: 'SO', flag: '🇸🇴', name: 'Somalia' },
  { code: '+27',   iso: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+82',   iso: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+211',  iso: 'SS', flag: '🇸🇸', name: 'South Sudan' },
  { code: '+34',   iso: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+94',   iso: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+249',  iso: 'SD', flag: '🇸🇩', name: 'Sudan' },
  { code: '+597',  iso: 'SR', flag: '🇸🇷', name: 'Suriname' },
  { code: '+46',   iso: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+41',   iso: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+963',  iso: 'SY', flag: '🇸🇾', name: 'Syria' },
  { code: '+886',  iso: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+992',  iso: 'TJ', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+255',  iso: 'TZ', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+66',   iso: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+670',  iso: 'TL', flag: '🇹🇱', name: 'Timor-Leste' },
  { code: '+228',  iso: 'TG', flag: '🇹🇬', name: 'Togo' },
  { code: '+690',  iso: 'TK', flag: '🇹🇰', name: 'Tokelau' },
  { code: '+676',  iso: 'TO', flag: '🇹🇴', name: 'Tonga' },
  { code: '+1868', iso: 'TT', flag: '🇹🇹', name: 'Trinidad and Tobago' },
  { code: '+216',  iso: 'TN', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+90',   iso: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+993',  iso: 'TM', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '+1649', iso: 'TC', flag: '🇹🇨', name: 'Turks and Caicos Islands' },
  { code: '+688',  iso: 'TV', flag: '🇹🇻', name: 'Tuvalu' },
  { code: '+256',  iso: 'UG', flag: '🇺🇬', name: 'Uganda' },
  { code: '+380',  iso: 'UA', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+971',  iso: 'AE', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+44',   iso: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1',    iso: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+598',  iso: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+998',  iso: 'UZ', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: '+678',  iso: 'VU', flag: '🇻🇺', name: 'Vanuatu' },
  { code: '+379',  iso: 'VA', flag: '🇻🇦', name: 'Vatican City' },
  { code: '+58',   iso: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+84',   iso: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+1340', iso: 'VI', flag: '🇻🇮', name: 'U.S. Virgin Islands' },
  { code: '+681',  iso: 'WF', flag: '🇼🇫', name: 'Wallis and Futuna' },
  { code: '+967',  iso: 'YE', flag: '🇾🇪', name: 'Yemen' },
  { code: '+260',  iso: 'ZM', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263',  iso: 'ZW', flag: '🇿🇼', name: 'Zimbabwe' },
];

/**
 * DS Input / Phone number — Figma: liyNDiFf1piO8SQmHNKoeU, node 19635-3445
 *
 * DS specs:
 *   Height: 40px
 *   Flag + country code selector on left
 *   Phone number input on right
 *   Same border/bg as Input field
 *
 * Usage:
 *   <fvdr-phone-input label="Phone" [(ngModel)]="phone" />
 */
@Component({
  selector: 'fvdr-phone-input',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
  ],
  template: `
    <div class="phone" [class.phone--disabled]="disabled">
      <label *ngIf="label" class="phone__label">{{ label }}</label>
      <div class="phone__wrapper" [class.phone__wrapper--focused]="focused">
        <!-- Country selector -->
        <div class="phone__country" (click)="showDropdown = !showDropdown">
          <span class="phone__flag">{{ selectedCountry.flag }}</span>
          <span class="phone__code">{{ selectedCountry.code }}</span>
          <fvdr-icon name="chevron-down" class="phone__chevron" [class.phone__chevron--open]="showDropdown" />
          <!-- Country dropdown -->
          <div *ngIf="showDropdown" class="phone__dropdown">
            <button
              *ngFor="let c of countries"
              class="phone__country-opt"
              type="button"
              [class.phone__country-opt--active]="c.iso === selectedCountry.iso"
              (click)="selectCountry(c); $event.stopPropagation()"
            >
              <span>{{ c.flag }}</span>
              <span>{{ c.name }}</span>
              <span class="phone__country-code">{{ c.code }}</span>
            </button>
          </div>
        </div>
        <div class="phone__divider"></div>
        <input
          class="phone__input"
          type="tel"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [(ngModel)]="number"
          (ngModelChange)="emit()"
          (focus)="focused = true"
          (blur)="focused = false; onTouched()"
        />
      </div>
      <span *ngIf="errorText" class="phone__error">{{ errorText }}</span>
    </div>
  `,
  styles: [`
    .phone { display: flex; flex-direction: column; gap: var(--space-1); }
    .phone--disabled { opacity: 0.45; pointer-events: none; }

    .phone__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }

    .phone__wrapper {
      display: flex;
      align-items: center;
      height: 40px;
      background: var(--color-stone-0);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s, background 0.15s;
      overflow: visible;
    }
    .phone__wrapper--focused { border-color: var(--color-primary-500); background: var(--color-stone-0); }

    .phone__country {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 var(--space-2) 0 var(--space-3);
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      height: 100%;
    }
    .phone__country:hover { background: var(--color-hover-bg); }
    .phone__flag { font-size: 16px; line-height: 1; }
    .phone__code { font-family: var(--font-family); font-size: var(--text-base-s-size); color: var(--color-text-primary); }
    .phone__chevron { font-size: 14px; color: var(--color-text-secondary); transition: transform 0.15s; }
    .phone__chevron--open { transform: rotate(180deg); }

    .phone__dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: -2px;
      z-index: 1000;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-popover);
      min-width: 200px;
      max-height: 200px;
      overflow-y: auto;
      padding: var(--space-1) 0;
    }
    .phone__country-opt {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: 0 var(--space-3);
      height: 36px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      text-align: left;
    }
    .phone__country-opt:hover { background: var(--color-hover-bg); }
    .phone__country-opt--active { color: var(--color-primary-500); font-weight: var(--text-base-s-sb-weight); }
    .phone__country-code { margin-left: auto; color: var(--color-text-secondary); font-size: var(--text-caption1-size); }

    .phone__divider { width: 1px; height: 20px; background: var(--color-stone-400); flex-shrink: 0; }

    .phone__input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      padding: 0 var(--space-3);
      height: 100%;
    }
    .phone__input::placeholder { color: var(--color-text-placeholder); }

    .phone__error {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size);
      color: var(--color-error-600);
    }
  `],
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '000 000 0000';
  @Input() disabled = false;
  @Input() errorText = '';
  @Input() countries: PhoneCountry[] = DEFAULT_COUNTRIES;

  selectedCountry: PhoneCountry =
    DEFAULT_COUNTRIES.find(c => c.iso === 'US') ?? DEFAULT_COUNTRIES[0];
  number = '';
  focused = false;
  showDropdown = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  selectCountry(c: PhoneCountry): void {
    this.selectedCountry = c;
    this.showDropdown = false;
    this.emit();
  }

  emit(): void { this.onChange(this.selectedCountry.code + this.number); }

  writeValue(v: string): void {
    if (!v) { this.number = ''; return; }
    const country = this.countries.find(c => v.startsWith(c.code));
    if (country) { this.selectedCountry = country; this.number = v.slice(country.code.length); }
    else this.number = v;
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
