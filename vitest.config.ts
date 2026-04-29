import { defineConfig, mergeConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default mergeConfig(
	defineConfig({
		plugins: [svelte()],
		resolve: {
			alias: { $lib: path.resolve('./src/lib') },
			conditions: ['browser'],
		},
	}),
	defineConfig({
		test: {
			environment: 'jsdom',
			include: ['src/**/*.test.ts'],
		},
	}),
);
