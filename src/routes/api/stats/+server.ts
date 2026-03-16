import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const submissionId = url.searchParams.get('id');
	if (!submissionId) throw error(400, 'Missing id parameter');

	// Get the submission
	const submission = await db
		.prepare('SELECT * FROM submissions WHERE id = ?')
		.bind(submissionId)
		.first();
	if (!submission) throw error(404, 'Submission not found');

	const totalMicromorts = submission.total_micromorts as number;
	const age = submission.age as number;
	const country = submission.country as string;

	// Overall percentile — what % of people have LOWER micromorts than you
	const overallRank = await db
		.prepare('SELECT COUNT(*) as count FROM submissions WHERE total_micromorts < ?')
		.bind(totalMicromorts)
		.first<{ count: number }>();
	const overallTotal = await db
		.prepare('SELECT COUNT(*) as count FROM submissions')
		.first<{ count: number }>();

	// Same age group (±5 years)
	const ageRank = await db
		.prepare(
			'SELECT COUNT(*) as count FROM submissions WHERE age BETWEEN ? AND ? AND total_micromorts < ?'
		)
		.bind(age - 5, age + 5, totalMicromorts)
		.first<{ count: number }>();
	const ageTotal = await db
		.prepare('SELECT COUNT(*) as count FROM submissions WHERE age BETWEEN ? AND ?')
		.bind(age - 5, age + 5)
		.first<{ count: number }>();

	// Same country
	const countryRank = await db
		.prepare(
			'SELECT COUNT(*) as count FROM submissions WHERE country = ? AND total_micromorts < ?'
		)
		.bind(country, totalMicromorts)
		.first<{ count: number }>();
	const countryTotal = await db
		.prepare('SELECT COUNT(*) as count FROM submissions WHERE country = ?')
		.bind(country)
		.first<{ count: number }>();

	// Global stats
	const globalStats = await db
		.prepare(
			'SELECT AVG(total_micromorts) as avg, MIN(total_micromorts) as min, MAX(total_micromorts) as max FROM submissions'
		)
		.first<{ avg: number; min: number; max: number }>();

	// Distribution buckets for histogram
	const buckets = await db
		.prepare(
			`SELECT
				CASE
					WHEN total_micromorts < 2 THEN '0-2'
					WHEN total_micromorts < 5 THEN '2-5'
					WHEN total_micromorts < 10 THEN '5-10'
					WHEN total_micromorts < 20 THEN '10-20'
					WHEN total_micromorts < 50 THEN '20-50'
					WHEN total_micromorts < 100 THEN '50-100'
					ELSE '100+'
				END as bucket,
				COUNT(*) as count
			FROM submissions
			GROUP BY bucket
			ORDER BY MIN(total_micromorts)`
		)
		.all();

	function percentile(rank: number, total: number): number {
		if (total <= 1) return 50;
		return Math.round((rank / total) * 100);
	}

	return json({
		your_micromorts: totalMicromorts,
		comparisons: {
			overall: {
				percentile: percentile(overallRank?.count ?? 0, overallTotal?.count ?? 1),
				total_submissions: overallTotal?.count ?? 0
			},
			age_group: {
				label: `Ages ${age - 5}-${age + 5}`,
				percentile: percentile(ageRank?.count ?? 0, ageTotal?.count ?? 1),
				total_in_group: ageTotal?.count ?? 0
			},
			country: {
				label: country,
				percentile: percentile(countryRank?.count ?? 0, countryTotal?.count ?? 1),
				total_in_group: countryTotal?.count ?? 0
			}
		},
		global: {
			average: Math.round((globalStats?.avg ?? 0) * 100) / 100,
			min: Math.round((globalStats?.min ?? 0) * 100) / 100,
			max: Math.round((globalStats?.max ?? 0) * 100) / 100
		},
		distribution: buckets.results
	});
};
