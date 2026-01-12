/**
 * Vite configuration.
 */

// Vendor dependencies.
import { defineConfig, type PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';
import { fileURLToPath, URL } from 'node:url';

// Initialisation.
const wasmPlugin = wasm() as PluginOption;

// Exposures.
export default defineConfig({
    build: {
        lib: {
            entry: fileURLToPath(new URL('src/index.ts', import.meta.url)),
            fileName: (format) => `datapos-tool-rust-csv-core.${format}.js`,
            formats: ['es']
        },
        rollupOptions: {
            external: ['@datapos/datapos-shared']
        },
        target: 'ESNext'
    },
    plugins: [dts({ outDir: 'dist/types' }), wasmPlugin],
    resolve: {
        alias: {
            '~': fileURLToPath(new URL('./', import.meta.url)),
            '@': fileURLToPath(new URL('src', import.meta.url))
        }
    }
});
