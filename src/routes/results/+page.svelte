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
	}

	let stats = $state<StatsData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let breakdown = $state<{ label: string; category: string; micromorts: number }[]>([]);

	onMount(async () => {
		const id = $page.url.searchParams.get('id');
		if (!id) {
			error = 'No submission ID found';
			loading = false;
			return;
		}

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

	// Build SVG bar chart data from distribution
	function chartData(dist: { bucket: string; count: number }[], yourMicromorts: number) {
		const bucketRanges: { label: string; min: number; max: number }[] = [
			{ label: '0-2', min: 0, max: 2 },
			{ label: '2-5', min: 2, max: 5 },
			{ label: '5-10', min: 5, max: 10 },
			{ label: '10-20', min: 10, max: 20 },
			{ label: '20-50', min: 20, max: 50 },
			{ label: '50-100', min: 50, max: 100 },
			{ label: '100+', min: 100, max: Infinity }
		];

		const maxCount = Math.max(...dist.map((d) => d.count), 1);

		return bucketRanges.map((range) => {
			const found = dist.find((d) => d.bucket === range.label);
			const count = found?.count ?? 0;
			const isYours = yourMicromorts >= range.min && yourMicromorts < range.max;
			return {
				label: range.label,
				count,
				height: (count / maxCount) * 100,
				isYours
			};
		});
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
			<p class="mb-1 text-sm font-medium uppercase text-gray-500">Your daily micromorts</p>
			<p class="text-6xl font-bold text-gray-900">{stats.your_micromorts}</p>
			<p class="mt-2 text-lg font-medium {risk.color}">{risk.label} Risk</p>
			<p class="mt-1 text-sm text-gray-500">
				That's a <strong>{stats.your_micromorts}</strong> in a million chance of death each day
			</p>
		</div>

		<!-- Comparisons -->
		<div class="mb-8 grid grid-cols-3 gap-4">
			<div class="rounded-xl bg-white p-4 text-center shadow-sm">
				<p class="text-xs font-medium uppercase text-gray-500">vs Everyone</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">
					{stats.comparisons.overall.percentile}th
				</p>
				<p class="text-xs text-gray-500">percentile</p>
				<p class="mt-1 text-xs text-gray-400">
					{percentileText(stats.comparisons.overall.percentile)}
				</p>
			</div>
			<div class="rounded-xl bg-white p-4 text-center shadow-sm">
				<p class="text-xs font-medium uppercase text-gray-500">
					{stats.comparisons.age_group.label}
				</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">
					{stats.comparisons.age_group.percentile}th
				</p>
				<p class="text-xs text-gray-500">percentile</p>
				<p class="mt-1 text-xs text-gray-400">
					{stats.comparisons.age_group.total_in_group} people in group
				</p>
			</div>
			<div class="rounded-xl bg-white p-4 text-center shadow-sm">
				<p class="text-xs font-medium uppercase text-gray-500">
					{stats.comparisons.country.label}
				</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">
					{stats.comparisons.country.percentile}th
				</p>
				<p class="text-xs text-gray-500">percentile</p>
				<p class="mt-1 text-xs text-gray-400">
					{stats.comparisons.country.total_in_group} people in group
				</p>
			</div>
		</div>

		<!-- Distribution chart -->
		{#if stats.distribution.length > 0}
			{@const bars = chartData(stats.distribution, stats.your_micromorts)}
			<div class="mb-8 rounded-xl bg-white p-6 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold text-gray-900">Where you fall</h2>
				<p class="mb-4 text-sm text-gray-500">
					Distribution of all submissions by daily micromorts
				</p>

				<!-- SVG Bar Chart -->
				<div class="relative">
					<svg viewBox="0 0 700 300" class="w-full" preserveAspectRatio="xMidYMid meet">
						<!-- Y-axis line -->
						<line x1="50" y1="20" x2="50" y2="240" stroke="#e5e7eb" stroke-width="1" />
						<!-- X-axis line -->
						<line x1="50" y1="240" x2="680" y2="240" stroke="#e5e7eb" stroke-width="1" />

						<!-- Grid lines -->
						{#each [0, 25, 50, 75, 100] as pct}
							{@const y = 240 - (pct / 100) * 210}
							<line
								x1="50"
								y1={y}
								x2="680"
								y2={y}
								stroke="#f3f4f6"
								stroke-width="1"
								stroke-dasharray={pct > 0 ? '4,4' : 'none'}
							/>
						{/each}

						<!-- Bars -->
						{#each bars as bar, i}
							{@const barWidth = 75}
							{@const gap = 15}
							{@const x = 60 + i * (barWidth + gap)}
							{@const barHeight = Math.max(3, (bar.height / 100) * 210)}
							{@const y = 240 - barHeight}

							<!-- Bar -->
							<rect
								{x}
								{y}
								width={barWidth}
								height={barHeight}
								rx="4"
								fill={bar.isYours ? '#2563eb' : '#e5e7eb'}
								class="transition-all duration-300"
							/>

							<!-- Count on top of bar -->
							{#if bar.count > 0}
								<text
									x={x + barWidth / 2}
									y={y - 6}
									text-anchor="middle"
									class="fill-gray-500 text-[11px]"
								>
									{bar.count}
								</text>
							{/if}

							<!-- "YOU" marker -->
							{#if bar.isYours}
								<!-- Arrow pointing down -->
								<polygon
									points="{x + barWidth / 2 - 6},{y - 30} {x + barWidth / 2 + 6},{y - 30} {x + barWidth / 2},{y - 20}"
									fill="#2563eb"
								/>
								<text
									x={x + barWidth / 2}
									y={y - 34}
									text-anchor="middle"
									class="fill-blue-600 text-[12px] font-bold"
								>
									YOU
								</text>
							{/if}

							<!-- X-axis label -->
							<text
								x={x + barWidth / 2}
								y="260"
								text-anchor="middle"
								class="fill-gray-500 text-[11px]"
							>
								{bar.label}
							</text>
						{/each}

						<!-- X-axis title -->
						<text x="370" y="285" text-anchor="middle" class="fill-gray-400 text-[12px]">
							Daily micromorts
						</text>

						<!-- Average line -->
						{#if stats.global.average > 0}
							{@const avgBucketIndex =
								stats.global.average < 2
									? 0
									: stats.global.average < 5
										? 1
										: stats.global.average < 10
											? 2
											: stats.global.average < 20
												? 3
												: stats.global.average < 50
													? 4
													: stats.global.average < 100
														? 5
														: 6}
							{@const barWidth = 75}
							{@const gap = 15}
							{@const avgX = 60 + avgBucketIndex * (barWidth + gap) + barWidth / 2}
							<line
								x1={avgX}
								y1="20"
								x2={avgX}
								y2="240"
								stroke="#f59e0b"
								stroke-width="2"
								stroke-dasharray="6,4"
							/>
							<text x={avgX + 4} y="16" class="fill-amber-500 text-[10px]">
								avg: {stats.global.average}
							</text>
						{/if}
					</svg>
				</div>
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
											class="font-mono {item.micromorts >= 0
												? 'text-red-600'
												: 'text-green-600'}"
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
