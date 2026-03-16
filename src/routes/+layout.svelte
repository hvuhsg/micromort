<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="border-b border-gray-200 bg-white">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
			<a href="/" class="text-xl font-bold text-gray-900">Micromort</a>
			<span class="text-sm text-gray-500">What's your daily risk?</span>
		</div>
	</nav>
	{@render children()}
</div>
