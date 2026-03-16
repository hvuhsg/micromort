import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateMicromorts, type SurveyData } from '$lib/server/micromorts';

function generateId(): string {
	const bytes = new Uint8Array(18);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
		.join('')
		.slice(0, 24);
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const raw = await request.json();
	const data: SurveyData = {
		age: raw.age ?? 30,
		sex: raw.sex || 'male',
		weight_kg: raw.weight_kg ?? 75,
		height_cm: raw.height_cm ?? 175,
		has_heart_disease: raw.has_heart_disease ?? false,
		has_diabetes: raw.has_diabetes ?? false,
		has_hypertension: raw.has_hypertension ?? false,
		has_cancer: raw.has_cancer ?? false,
		has_respiratory_disease: raw.has_respiratory_disease ?? false,
		transport_mode: raw.transport_mode || 'car',
		km_per_day: raw.km_per_day ?? 0,
		diet: raw.diet || 'average',
		drinks_per_week: raw.drinks_per_week ?? 0,
		smoking_status: raw.smoking_status || 'never',
		cigarettes_per_day: raw.cigarettes_per_day ?? 0,
		exercise_hours_per_week: raw.exercise_hours_per_week ?? 0,
		does_skydiving: raw.does_skydiving ?? false,
		does_scuba: raw.does_scuba ?? false,
		does_motorcycling: raw.does_motorcycling ?? false,
		does_skiing: raw.does_skiing ?? false,
		does_rock_climbing: raw.does_rock_climbing ?? false,
		country: raw.country || 'United States'
	};
	const result = calculateMicromorts(data);
	const id = generateId();

	await db
		.prepare(
			`INSERT INTO submissions (
			id, age, sex, weight_kg, height_cm,
			has_heart_disease, has_diabetes, has_hypertension, has_cancer, has_respiratory_disease,
			transport_mode, km_per_day, diet, drinks_per_week,
			smoking_status, cigarettes_per_day, exercise_hours_per_week,
			does_skydiving, does_scuba, does_motorcycling, does_skiing, does_rock_climbing,
			country,
			total_micromorts, body_micromorts, habits_micromorts, location_micromorts
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			data.age,
			data.sex,
			data.weight_kg,
			data.height_cm,
			data.has_heart_disease ? 1 : 0,
			data.has_diabetes ? 1 : 0,
			data.has_hypertension ? 1 : 0,
			data.has_cancer ? 1 : 0,
			data.has_respiratory_disease ? 1 : 0,
			data.transport_mode,
			data.km_per_day,
			data.diet,
			data.drinks_per_week,
			data.smoking_status,
			data.cigarettes_per_day,
			data.exercise_hours_per_week,
			data.does_skydiving ? 1 : 0,
			data.does_scuba ? 1 : 0,
			data.does_motorcycling ? 1 : 0,
			data.does_skiing ? 1 : 0,
			data.does_rock_climbing ? 1 : 0,
			data.country,
			result.total,
			result.body,
			result.habits,
			result.location
		)
		.run();

	return json({ id, ...result });
};
