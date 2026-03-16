<script lang="ts">
	let submitting = $state(false);
	let currentStep = $state(0);
	const totalSteps = 4;

	// Body
	let age = $state(30);
	let sex = $state<'male' | 'female'>('male');
	let weight_kg = $state(75);
	let height_cm = $state(175);
	let has_heart_disease = $state(false);
	let has_diabetes = $state(false);
	let has_hypertension = $state(false);
	let has_cancer = $state(false);
	let has_respiratory_disease = $state(false);

	// Habits
	let transport_mode = $state<'car' | 'motorcycle' | 'bicycle' | 'public_transit' | 'walking'>(
		'car'
	);
	let km_per_day = $state(30);
	let diet = $state<'healthy' | 'average' | 'unhealthy'>('average');
	let drinks_per_week = $state(3);
	let smoking_status = $state<'never' | 'former' | 'current'>('never');
	let cigarettes_per_day = $state(0);
	let exercise_hours_per_week = $state(3);

	// Activities
	let does_skydiving = $state(false);
	let does_scuba = $state(false);
	let does_motorcycling = $state(false);
	let does_skiing = $state(false);
	let does_rock_climbing = $state(false);

	// Location
	let country = $state('United States');

	const countries = [
		'Afghanistan',
		'Argentina',
		'Australia',
		'Bangladesh',
		'Brazil',
		'Canada',
		'Central African Republic',
		'Chad',
		'China',
		'Colombia',
		'Democratic Republic of Congo',
		'Egypt',
		'Ethiopia',
		'France',
		'Germany',
		'Iceland',
		'India',
		'Indonesia',
		'Iran',
		'Iraq',
		'Israel',
		'Italy',
		'Japan',
		'Mexico',
		'Netherlands',
		'New Zealand',
		'Nigeria',
		'Norway',
		'Pakistan',
		'Philippines',
		'Russia',
		'Sierra Leone',
		'Singapore',
		'Somalia',
		'South Africa',
		'South Korea',
		'Spain',
		'Sweden',
		'Switzerland',
		'Thailand',
		'Turkey',
		'Ukraine',
		'United Kingdom',
		'United States',
		'Vietnam'
	];

	async function handleSubmit() {
		submitting = true;
		try {
			const res = await fetch('/api/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					age,
					sex,
					weight_kg,
					height_cm,
					has_heart_disease,
					has_diabetes,
					has_hypertension,
					has_cancer,
					has_respiratory_disease,
					transport_mode,
					km_per_day,
					diet,
					drinks_per_week,
					smoking_status,
					cigarettes_per_day,
					exercise_hours_per_week,
					does_skydiving,
					does_scuba,
					does_motorcycling,
					does_skiing,
					does_rock_climbing,
					country
				})
			});
			const data = await res.json();
			try {
				sessionStorage.setItem(`micromort_${data.id}`, JSON.stringify(data.breakdown));
			} catch {}
			window.location.href = `/results?id=${data.id}`;
		} catch {
			submitting = false;
		}
	}

	function next() {
		if (currentStep < totalSteps - 1) currentStep++;
	}
	function prev() {
		if (currentStep > 0) currentStep--;
	}
</script>

<main class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-3xl font-bold text-gray-900">Micromort Calculator</h1>
		<p class="text-gray-600">
			A <strong>micromort</strong> is a one-in-a-million chance of death. Find out your estimated daily
			micromorts based on your body, habits, and location.
		</p>
	</div>

	<!-- Progress bar -->
	<div class="mb-8 flex gap-2">
		{#each ['Body', 'Habits', 'Activities', 'Location'] as label, i}
			<button
				class="flex-1 rounded-full py-1.5 text-center text-sm font-medium transition-colors {i <=
				currentStep
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-500'}"
				onclick={() => (currentStep = i)}
			>
				{label}
			</button>
		{/each}
	</div>

	<div class="rounded-xl bg-white p-6 shadow-sm">
		<!-- Step 1: Body -->
		{#if currentStep === 0}
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Your Body</h2>
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="age" class="mb-1 block text-sm font-medium text-gray-700">Age</label>
						<input
							id="age"
							type="number"
							bind:value={age}
							min="1"
							max="120"
							class="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>
					<div>
						<label for="sex" class="mb-1 block text-sm font-medium text-gray-700">Sex</label>
						<select
							id="sex"
							bind:value={sex}
							class="w-full rounded-lg border border-gray-300 px-3 py-2"
						>
							<option value="male">Male</option>
							<option value="female">Female</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="weight" class="mb-1 block text-sm font-medium text-gray-700"
							>Weight (kg)</label
						>
						<input
							id="weight"
							type="number"
							bind:value={weight_kg}
							min="20"
							max="300"
							class="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>
					<div>
						<label for="height" class="mb-1 block text-sm font-medium text-gray-700"
							>Height (cm)</label
						>
						<input
							id="height"
							type="number"
							bind:value={height_cm}
							min="100"
							max="250"
							class="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>
				</div>

				<div>
					<p class="mb-2 text-sm font-medium text-gray-700">Medical conditions</p>
					<div class="space-y-2">
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={has_heart_disease} class="rounded" />
							<span class="text-sm text-gray-700">Heart disease</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={has_diabetes} class="rounded" />
							<span class="text-sm text-gray-700">Diabetes</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={has_hypertension} class="rounded" />
							<span class="text-sm text-gray-700">Hypertension</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={has_cancer} class="rounded" />
							<span class="text-sm text-gray-700">Cancer</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={has_respiratory_disease} class="rounded" />
							<span class="text-sm text-gray-700">Respiratory disease (COPD, asthma)</span>
						</label>
					</div>
				</div>
			</div>

		<!-- Step 2: Habits -->
		{:else if currentStep === 1}
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Your Habits</h2>
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="transport" class="mb-1 block text-sm font-medium text-gray-700"
							>Main transport</label
						>
						<select
							id="transport"
							bind:value={transport_mode}
							class="w-full rounded-lg border border-gray-300 px-3 py-2"
						>
							<option value="car">Car</option>
							<option value="motorcycle">Motorcycle</option>
							<option value="bicycle">Bicycle</option>
							<option value="public_transit">Public transit</option>
							<option value="walking">Walking</option>
						</select>
					</div>
					<div>
						<label for="km" class="mb-1 block text-sm font-medium text-gray-700">km/day</label>
						<input
							id="km"
							type="number"
							bind:value={km_per_day}
							min="0"
							max="500"
							class="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>
				</div>

				<div>
					<label for="diet" class="mb-1 block text-sm font-medium text-gray-700">Diet</label>
					<select
						id="diet"
						bind:value={diet}
						class="w-full rounded-lg border border-gray-300 px-3 py-2"
					>
						<option value="healthy">Healthy (lots of fruits, vegetables, whole grains)</option>
						<option value="average">Average</option>
						<option value="unhealthy">Unhealthy (processed food, high sugar/fat)</option>
					</select>
				</div>

				<div>
					<label for="drinks" class="mb-1 block text-sm font-medium text-gray-700"
						>Alcoholic drinks per week</label
					>
					<input
						id="drinks"
						type="number"
						bind:value={drinks_per_week}
						min="0"
						max="100"
						class="w-full rounded-lg border border-gray-300 px-3 py-2"
					/>
				</div>

				<div>
					<label for="smoking" class="mb-1 block text-sm font-medium text-gray-700"
						>Smoking status</label
					>
					<select
						id="smoking"
						bind:value={smoking_status}
						class="w-full rounded-lg border border-gray-300 px-3 py-2"
					>
						<option value="never">Never smoked</option>
						<option value="former">Former smoker</option>
						<option value="current">Current smoker</option>
					</select>
				</div>

				{#if smoking_status === 'current'}
					<div>
						<label for="cigs" class="mb-1 block text-sm font-medium text-gray-700"
							>Cigarettes per day</label
						>
						<input
							id="cigs"
							type="number"
							bind:value={cigarettes_per_day}
							min="1"
							max="100"
							class="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>
				{/if}

				<div>
					<label for="exercise" class="mb-1 block text-sm font-medium text-gray-700"
						>Exercise hours per week</label
					>
					<input
						id="exercise"
						type="number"
						bind:value={exercise_hours_per_week}
						min="0"
						max="40"
						step="0.5"
						class="w-full rounded-lg border border-gray-300 px-3 py-2"
					/>
				</div>
			</div>

		<!-- Step 3: Activities -->
		{:else if currentStep === 2}
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Risky Activities</h2>
			<p class="mb-4 text-sm text-gray-500">Do you regularly do any of these? (at least once a month)</p>
			<div class="space-y-3">
				<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
					<input type="checkbox" bind:checked={does_skydiving} class="rounded" />
					<div>
						<span class="font-medium text-gray-900">Skydiving</span>
						<span class="block text-xs text-gray-500">~8 micromorts per jump</span>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
					<input type="checkbox" bind:checked={does_scuba} class="rounded" />
					<div>
						<span class="font-medium text-gray-900">Scuba diving</span>
						<span class="block text-xs text-gray-500">~5 micromorts per dive</span>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
					<input type="checkbox" bind:checked={does_motorcycling} class="rounded" />
					<div>
						<span class="font-medium text-gray-900">Recreational motorcycling</span>
						<span class="block text-xs text-gray-500">~12 micromorts per ride</span>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
					<input type="checkbox" bind:checked={does_skiing} class="rounded" />
					<div>
						<span class="font-medium text-gray-900">Skiing / Snowboarding</span>
						<span class="block text-xs text-gray-500">~0.7 micromorts per day</span>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
					<input type="checkbox" bind:checked={does_rock_climbing} class="rounded" />
					<div>
						<span class="font-medium text-gray-900">Rock climbing</span>
						<span class="block text-xs text-gray-500">~3 micromorts per session</span>
					</div>
				</label>
			</div>

		<!-- Step 4: Location -->
		{:else if currentStep === 3}
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Your Location</h2>
			<div>
				<label for="country" class="mb-1 block text-sm font-medium text-gray-700">Country</label>
				<select
					id="country"
					bind:value={country}
					class="w-full rounded-lg border border-gray-300 px-3 py-2"
				>
					{#each countries as c}
						<option value={c}>{c}</option>
					{/each}
				</select>
				<p class="mt-2 text-xs text-gray-500">
					Country affects your baseline risk based on healthcare quality, safety infrastructure, and
					environmental factors.
				</p>
			</div>
		{/if}

		<!-- Navigation -->
		<div class="mt-6 flex justify-between">
			{#if currentStep > 0}
				<button
					onclick={prev}
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Back
				</button>
			{:else}
				<div></div>
			{/if}

			{#if currentStep < totalSteps - 1}
				<button
					onclick={next}
					class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
				>
					Next
				</button>
			{:else}
				<button
					onclick={handleSubmit}
					disabled={submitting}
					class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{submitting ? 'Calculating...' : 'Calculate My Micromorts'}
				</button>
			{/if}
		</div>
	</div>

	<p class="mt-6 text-center text-xs text-gray-400">
		Based on public micromort data from Spiegelhalter (Cambridge), WHO, CDC, and actuarial tables.
		This is an educational estimate, not medical advice.
	</p>
</main>
