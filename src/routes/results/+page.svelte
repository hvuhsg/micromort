<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	interface Comparison {
		percentile: number;
		total_submissions?: number;
		total_in_group?: number;
		label?: string;
	}

	interface StatsData {
		your_micromorts: number;
		comparisons: {
			overall: Comparison;
			age_group: Comparison;
			country: Comparison;
		};
		global: {
			average: number;
			min: number;
			max: number;
		};
		distribution: { bucket: string; count: number }[];
		breakdown?: { label: string; category: string; micromorts: number }[];
	}

	let stats = $state<StatsData | null>(null);
	let loading = $state(true);
	let error = $state('');

	// Stored from the submit response in sessionStorage
	let breakdown = $state<{ label: string; category: string; micromorts: number }[]>([]);

	onMount(async () => {
		const id = $page.url.searchParams.get('id');
		if (!id) {
			error = 'No submission ID found';
			loading = false;
			return;
		}

		// Try to get breakdown from sessionStorage (set during submit)
		try {
			const stored = sessionStorage.getItem(`micromort_${id}`);
			if (stored) breakdown = JSON.parse(stored);
		} catch {}

		try {
			const res = await fetch(`/api/stats?id=${id}`);
			if (!res.ok) throw new Error('Failed to load stats');
			stats = await res.json();
		} catch (e) {
			error = 'Failed to load your results. Please try again.';
		}
		loading = false;
	});

	function riskLevel(micromorts: number): { label: string; color: string } {
		if (micromorts < 2) return { label: 'Very Low', color: 'text-green-600' };
		if (micromorts < 5) return { label: 'Low', color: 'text-green-500' };
		if (micromorts < 15) return { label: 'Average', color: 'text-yellow-600' };
		if (micromorts < 30) return { label: 'Elevated', color: 'text-orange-500' };
		if (micromorts < 60) return { label: 'High', color: 'text-red-500' };
		return { label: 'Very High', color: 'text-red-700' };
	}

	function percentileText(p: number): string {
		if (p < 25) return 'lower risk than most';
		if (p < 50) return 'below average risk';
		if (p < 75) return 'above average risk';
		return 'higher risk than most';
	}

	function maxBucket(dist: { bucket: string; count: number }[]): number {
		return Math.max(...dist.map((d) => d.count), 1);
	}
</script>

<svelte:head>
	<title>Your Micromort Results</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-8">
	{#if loading}
		<div class="py-20 text-center text-gray-500">Loading your results...</div>
	{:else if error}
		<div class="py-20 text-center text-red-600">{error}</div>
	{:else if stats}
		{@const risk = riskLevel(stats.your_micromorts)}

		<!-- Big number -->
		<div class="mb-8 rounded-xl bg-white p-8 text-center shadow-sm">
			<p class="mb-1 text-sm font-medium text-gray-500 uppercase">Your daily micromorts</p>
			<p class="text-6xl font-bold text-gray-900">{stats.your_micromorts}</p>
			<p class="mt-2 text-lg font-medium {risk.color}">{risk.label} Risk</p>
			<p class="mt-1 text-sm text-gray-500">
				That's a <strong>{stats.your_micromorts}</strong> in a million chance of death each day
			</p>
		</div>

		<!-- Comparisons -->
		<div class="mb-8 grid grid-cols-3 gap-4">
			<div class="rounded-xl bg-white p-4 text-center shadow-sm">
				<p class="text-xs font-medium text-gray-500 uppercase">vs Everyone</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">
					{stats.comparisons.overall.percentile}th
				</p>
				<p class="text-xs text-gray-500">percentile</p>
				<p class="mt-1 text-xs text-gray-400">
					{percentileText(stats.comparisons.overall.percentile)}
				</p>
			</div>
			<div class="rounded-xl bg-white p-4 text-center shadow-sm">
				<p class="text-xs font-medium text-gray-500 uppercase">{stats.comparisons.age_group.label}</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">
					{stats.comparisons.age_group.percentile}th
				</p>
				<p class="text-xs text-gray-500">percentile</p>
				<p class="mt-1 text-xs text-gray-400">
					{stats.comparisons.age_group.total_in_group} people in group
				</p>
			</div>
			<div class="rounded-xl bg-white p-4 text-center shadow-sm">
				<p class="text-xs font-medium text-gray-500 uppercase">{stats.comparisons.country.label}</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">
					{stats.comparisons.country.percentile}th
				</p>
				<p class="text-xs text-gray-500">percentile</p>
				<p class="mt-1 text-xs text-gray-400">
					{stats.comparisons.country.total_in_group} people in group
				</p>
			</div>
		</div>

		<!-- Distribution histogram -->
		{#if stats.distribution.length > 0}
			<div class="mb-8 rounded-xl bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">How you compare</h2>
				<div class="space-y-2">
					{#each stats.distribution as bucket}
						{@const isYours =
							(bucket.bucket === '0-2' && stats.your_micromorts < 2) ||
							(bucket.bucket === '2-5' && stats.your_micromorts >= 2 && stats.your_micromorts < 5) ||
							(bucket.bucket === '5-10' && stats.your_micromorts >= 5 && stats.your_micromorts < 10) ||
							(bucket.bucket === '10-20' && stats.your_micromorts >= 10 && stats.your_micromorts < 20) ||
							(bucket.bucket === '20-50' && stats.your_micromorts >= 20 && stats.your_micromorts < 50) ||
							(bucket.bucket === '50-100' && stats.your_micromorts >= 50 && stats.your_micromorts < 100) ||
							(bucket.bucket === '100+' && stats.your_micromorts >= 100)}
						<div class="flex items-center gap-3">
							<span class="w-16 text-right text-xs text-gray-500">{bucket.bucket}</span>
							<div class="flex-1">
								<div
									class="h-6 rounded {isYours ? 'bg-blue-600' : 'bg-gray-200'}"
									style="width: {Math.max(4, (bucket.count / maxBucket(stats.distribution)) * 100)}%"
								></div>
							</div>
							<span class="w-8 text-xs text-gray-500">{bucket.count}</span>
							{#if isYours}
								<span class="text-xs font-medium text-blue-600">You</span>
							{/if}
						</div>
					{/each}
				</div>
				<p class="mt-3 text-xs text-gray-400">
					Global average: {stats.global.average} micromorts/day
				</p>
			</div>
		{/if}

		<!-- Breakdown -->
		{#if breakdown.length > 0}
			<div class="mb-8 rounded-xl bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Breakdown</h2>
				{#each ['body', 'habits', 'location'] as category}
					{@const items = breakdown.filter((b) => b.category === category)}
					{#if items.length > 0}
						<div class="mb-4">
							<h3 class="mb-2 text-sm font-medium capitalize text-gray-500">{category}</h3>
							<div class="space-y-1">
								{#each items as item}
									<div class="flex justify-between text-sm">
										<span class="text-gray-700">{item.label}</span>
										<span
											class="font-mono {item.micromorts >= 0 ? 'text-red-600' : 'text-green-600'}"
										>
											{item.micromorts > 0 ? '+' : ''}{item.micromorts}
										</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- CTA -->
		<div class="text-center">
			<a
				href="/"
				class="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
			>
				Take the survey again
			</a>
		</div>
	{/if}
</main>
