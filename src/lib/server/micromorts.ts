/**
 * Micromort Calculator
 *
 * A micromort = one-in-a-million chance of death.
 * All values are expressed as micromorts PER DAY unless noted.
 *
 * Sources:
 * - Ronald Howard's original micromort concept (Stanford)
 * - David Spiegelhalter's "Understanding Uncertainty" (Cambridge)
 * - WHO Global Health Observatory data
 * - CDC WISQARS / National Vital Statistics
 * - Insurance actuarial tables
 */

export interface SurveyData {
	// Body
	age: number;
	sex: 'male' | 'female';
	weight_kg: number;
	height_cm: number;
	has_heart_disease: boolean;
	has_diabetes: boolean;
	has_hypertension: boolean;
	has_cancer: boolean;
	has_respiratory_disease: boolean;
	// Habits
	transport_mode: 'car' | 'motorcycle' | 'bicycle' | 'public_transit' | 'walking';
	km_per_day: number;
	diet: 'healthy' | 'average' | 'unhealthy';
	drinks_per_week: number;
	smoking_status: 'never' | 'former' | 'current';
	cigarettes_per_day: number;
	exercise_hours_per_week: number;
	// Activities
	does_skydiving: boolean;
	does_scuba: boolean;
	does_motorcycling: boolean;
	does_skiing: boolean;
	does_rock_climbing: boolean;
	// Location
	country: string;
}

export interface MicromortResult {
	total: number;
	body: number;
	habits: number;
	location: number;
	breakdown: {
		label: string;
		category: 'body' | 'habits' | 'location';
		micromorts: number;
	}[];
}

/**
 * Baseline daily micromorts by age (per day).
 * Derived from actuarial life tables — the background risk of dying
 * on any given day simply from being alive at that age.
 *
 * Source: SSA Period Life Tables, Spiegelhalter's risk tables
 */
function baselineByAge(age: number, sex: 'male' | 'female'): number {
	// Approximate daily mortality rate per million (micromorts)
	// Based on US life tables, male rates ~1.5x female at most ages
	const sexFactor = sex === 'male' ? 1.0 : 0.65;

	if (age < 1) return 11 * sexFactor;
	if (age < 5) return 0.5 * sexFactor;
	if (age < 15) return 0.3 * sexFactor;
	if (age < 25) return 1.4 * sexFactor;
	if (age < 35) return 1.8 * sexFactor;
	if (age < 45) return 2.5 * sexFactor;
	if (age < 55) return 5.5 * sexFactor;
	if (age < 65) return 13 * sexFactor;
	if (age < 75) return 30 * sexFactor;
	if (age < 85) return 80 * sexFactor;
	return 200 * sexFactor;
}

/**
 * BMI-related additional risk (daily micromorts).
 * Obese individuals have ~1.2-1.3x all-cause mortality.
 * Underweight also carries risk.
 */
function bmiRisk(weight_kg: number, height_cm: number, age: number, sex: 'male' | 'female'): number {
	const height_m = height_cm / 100;
	const bmi = weight_kg / (height_m * height_m);
	const baseline = baselineByAge(age, sex);

	if (bmi < 18.5) return baseline * 0.15; // Underweight adds ~15% risk
	if (bmi < 25) return 0; // Normal — no added risk
	if (bmi < 30) return baseline * 0.1; // Overweight adds ~10%
	if (bmi < 35) return baseline * 0.25; // Obese I adds ~25%
	if (bmi < 40) return baseline * 0.5; // Obese II adds ~50%
	return baseline * 0.9; // Obese III adds ~90%
}

/**
 * Medical conditions — additional daily micromorts.
 * These are rough estimates of the excess daily mortality risk.
 *
 * Sources: Various epidemiological studies, WHO data
 */
function medicalConditionRisk(data: SurveyData): { label: string; micromorts: number }[] {
	const results: { label: string; micromorts: number }[] = [];
	const ageFactor = Math.max(1, data.age / 50); // conditions more deadly with age

	if (data.has_heart_disease) {
		// Heart disease roughly doubles mortality risk
		results.push({
			label: 'Heart disease',
			micromorts: baselineByAge(data.age, data.sex) * 1.0 * ageFactor
		});
	}
	if (data.has_diabetes) {
		// Diabetes increases mortality ~1.8x
		results.push({
			label: 'Diabetes',
			micromorts: baselineByAge(data.age, data.sex) * 0.6 * ageFactor
		});
	}
	if (data.has_hypertension) {
		// Hypertension adds ~40% mortality risk
		results.push({
			label: 'Hypertension',
			micromorts: baselineByAge(data.age, data.sex) * 0.3
		});
	}
	if (data.has_cancer) {
		// Cancer — highly variable, using average excess
		results.push({
			label: 'Cancer',
			micromorts: baselineByAge(data.age, data.sex) * 2.0 * ageFactor
		});
	}
	if (data.has_respiratory_disease) {
		results.push({
			label: 'Respiratory disease',
			micromorts: baselineByAge(data.age, data.sex) * 0.5
		});
	}

	return results;
}

/**
 * Transport risk — micromorts per km traveled.
 *
 * Source: Spiegelhalter, UK DfT, NHTSA
 * - Car: ~0.3 micromorts per 100 km (3 deaths per billion km)
 * - Motorcycle: ~12 micromorts per 100 km
 * - Bicycle: ~4.3 micromorts per 100 km
 * - Walking: ~5.4 micromorts per 100 km
 * - Public transit: ~0.07 micromorts per 100 km
 */
function transportRisk(mode: string, km_per_day: number): number {
	const riskPer100km: Record<string, number> = {
		car: 0.3,
		motorcycle: 12,
		bicycle: 4.3,
		public_transit: 0.07,
		walking: 5.4
	};
	const rate = riskPer100km[mode] ?? 0.3;
	return (km_per_day / 100) * rate;
}

/**
 * Smoking risk — daily micromorts.
 *
 * Each cigarette costs roughly 11 minutes of life (Shaw et al.)
 * = ~0.5 micromorts per cigarette.
 * Former smokers have elevated but reduced risk (~30% of current).
 */
function smokingRisk(status: string, cigarettes_per_day: number): number {
	if (status === 'current') return cigarettes_per_day * 0.5;
	if (status === 'former') return 1.5; // Residual risk ~1.5 micromorts/day
	return 0;
}

/**
 * Alcohol risk — daily micromorts.
 *
 * Moderate drinking (1-2/day) has minimal excess mortality.
 * Heavy drinking (>4/day) significantly increases risk.
 * Source: Global Burden of Disease alcohol study
 */
function alcoholRisk(drinks_per_week: number): number {
	const per_day = drinks_per_week / 7;
	if (per_day <= 1) return 0;
	if (per_day <= 2) return 0.5;
	if (per_day <= 4) return 2;
	if (per_day <= 6) return 5;
	return 10;
}

/**
 * Diet risk — daily micromorts.
 *
 * Poor diet is a leading risk factor for mortality.
 * Source: GBD dietary risk factors study
 */
function dietRisk(diet: string): number {
	if (diet === 'healthy') return -0.5; // Protective effect
	if (diet === 'average') return 0;
	return 2; // Unhealthy diet
}

/**
 * Exercise benefit — daily micromorts (negative = protective).
 *
 * Regular exercise reduces all-cause mortality by ~30%.
 * Source: WHO physical activity guidelines, meta-analyses
 */
function exerciseBenefit(hours_per_week: number, age: number, sex: 'male' | 'female'): number {
	const baseline = baselineByAge(age, sex);
	if (hours_per_week >= 7) return -baseline * 0.3;
	if (hours_per_week >= 3.5) return -baseline * 0.25;
	if (hours_per_week >= 1) return -baseline * 0.15;
	return 0; // Sedentary — no benefit
}

/**
 * Risky activities — micromorts per session.
 * Assume roughly 1 session per week for reported activities → daily average.
 *
 * Source: Spiegelhalter, USPA, BSAC, NSC
 * - Skydiving: ~8 micromorts per jump
 * - Scuba diving: ~5 micromorts per dive
 * - Motorcycling (recreational): included in transport
 * - Skiing (per day): ~0.7 micromorts
 * - Rock climbing: ~3 micromorts per session
 */
function activityRisk(data: SurveyData): { label: string; micromorts: number }[] {
	const results: { label: string; micromorts: number }[] = [];
	// Assume ~1 session per week → divide by 7 for daily
	if (data.does_skydiving) results.push({ label: 'Skydiving', micromorts: 8 / 7 });
	if (data.does_scuba) results.push({ label: 'Scuba diving', micromorts: 5 / 7 });
	if (data.does_motorcycling) results.push({ label: 'Recreational motorcycling', micromorts: 12 / 7 });
	if (data.does_skiing) results.push({ label: 'Skiing', micromorts: 0.7 / 7 });
	if (data.does_rock_climbing) results.push({ label: 'Rock climbing', micromorts: 3 / 7 });
	return results;
}

/**
 * Country-level background risk — additional daily micromorts
 * based on deviation from a baseline (US-level risk).
 *
 * Derived from WHO life expectancy / crude death rate data.
 * Expressed as a modifier on the age-based baseline.
 * A value of 0 means same as US, positive means higher risk.
 */
const COUNTRY_RISK_MODIFIER: Record<string, number> = {
	// Very low risk (long life expectancy)
	Japan: -0.15,
	Switzerland: -0.12,
	Singapore: -0.12,
	Spain: -0.1,
	Italy: -0.1,
	Australia: -0.1,
	Sweden: -0.08,
	Norway: -0.08,
	Iceland: -0.1,
	Israel: -0.08,
	'South Korea': -0.05,
	Canada: -0.05,
	France: -0.05,
	Germany: -0.03,
	'United Kingdom': -0.02,
	'New Zealand': -0.05,
	Netherlands: -0.03,
	// Baseline
	'United States': 0,
	// Moderate risk
	China: 0.05,
	Mexico: 0.1,
	Brazil: 0.15,
	Turkey: 0.05,
	Argentina: 0.1,
	Colombia: 0.15,
	Thailand: 0.05,
	// Higher risk
	India: 0.25,
	Russia: 0.3,
	Indonesia: 0.15,
	Egypt: 0.2,
	Bangladesh: 0.3,
	Pakistan: 0.35,
	Philippines: 0.15,
	Vietnam: 0.1,
	Ukraine: 0.3,
	Iran: 0.15,
	Iraq: 0.35,
	// High risk
	'South Africa': 0.5,
	Nigeria: 0.6,
	Ethiopia: 0.5,
	'Democratic Republic of Congo': 0.7,
	Afghanistan: 0.7,
	Somalia: 0.8,
	'Central African Republic': 0.9,
	Chad: 0.8,
	'Sierra Leone': 0.85
};

function locationRisk(country: string, age: number, sex: 'male' | 'female'): number {
	const modifier = COUNTRY_RISK_MODIFIER[country] ?? 0;
	return baselineByAge(age, sex) * modifier;
}

export function calculateMicromorts(data: SurveyData): MicromortResult {
	const breakdown: MicromortResult['breakdown'] = [];

	// --- BODY ---
	const ageBaseline = baselineByAge(data.age, data.sex);
	breakdown.push({ label: `Age baseline (${data.age}, ${data.sex})`, category: 'body', micromorts: ageBaseline });

	const bmi = bmiRisk(data.weight_kg, data.height_cm, data.age, data.sex);
	if (bmi !== 0) {
		const height_m = data.height_cm / 100;
		const bmiVal = (data.weight_kg / (height_m * height_m)).toFixed(1);
		breakdown.push({ label: `BMI (${bmiVal})`, category: 'body', micromorts: bmi });
	}

	const medical = medicalConditionRisk(data);
	for (const m of medical) {
		breakdown.push({ label: m.label, category: 'body', micromorts: m.micromorts });
	}

	// --- HABITS ---
	const transport = transportRisk(data.transport_mode, data.km_per_day);
	if (transport > 0) {
		const modeLabel = data.transport_mode.replace('_', ' ');
		breakdown.push({
			label: `${modeLabel} (${data.km_per_day} km/day)`,
			category: 'habits',
			micromorts: transport
		});
	}

	const smoking = smokingRisk(data.smoking_status, data.cigarettes_per_day);
	if (smoking > 0) {
		breakdown.push({ label: `Smoking (${data.smoking_status})`, category: 'habits', micromorts: smoking });
	}

	const alcohol = alcoholRisk(data.drinks_per_week);
	if (alcohol !== 0) {
		breakdown.push({
			label: `Alcohol (${data.drinks_per_week} drinks/week)`,
			category: 'habits',
			micromorts: alcohol
		});
	}

	const diet = dietRisk(data.diet);
	if (diet !== 0) {
		breakdown.push({ label: `Diet (${data.diet})`, category: 'habits', micromorts: diet });
	}

	const exercise = exerciseBenefit(data.exercise_hours_per_week, data.age, data.sex);
	if (exercise !== 0) {
		breakdown.push({
			label: `Exercise (${data.exercise_hours_per_week} hrs/week)`,
			category: 'habits',
			micromorts: exercise
		});
	}

	const activities = activityRisk(data);
	for (const a of activities) {
		breakdown.push({ label: a.label, category: 'habits', micromorts: a.micromorts });
	}

	// --- LOCATION ---
	const location = locationRisk(data.country, data.age, data.sex);
	if (location !== 0) {
		breakdown.push({ label: `Country (${data.country})`, category: 'location', micromorts: location });
	}

	const body = breakdown.filter((b) => b.category === 'body').reduce((s, b) => s + b.micromorts, 0);
	const habits = breakdown.filter((b) => b.category === 'habits').reduce((s, b) => s + b.micromorts, 0);
	const loc = breakdown.filter((b) => b.category === 'location').reduce((s, b) => s + b.micromorts, 0);
	const total = Math.max(0, body + habits + loc);

	return {
		total: Math.round(total * 100) / 100,
		body: Math.round(body * 100) / 100,
		habits: Math.round(Math.max(0, habits) * 100) / 100,
		location: Math.round(loc * 100) / 100,
		breakdown: breakdown.map((b) => ({
			...b,
			micromorts: Math.round(b.micromorts * 100) / 100
		}))
	};
}

export const COUNTRIES = Object.keys(COUNTRY_RISK_MODIFIER).sort();
