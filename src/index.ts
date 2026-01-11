/**
 * CSV Core Tool with Rust/WASM processing.
 *
 * Provides high-performance CSV parsing with two modes:
 * - Stream mode: For browsers supporting transferable ReadableStreams (Chromium)
 * - Chunk mode: For browsers without transferable stream support (Safari)
 */

// Framework dependencies.
import { OperationalError } from '@datapos/datapos-shared/errors';

// Tool dependencies - types.
import type * as RustModule from '../rust/datapos_tool_rust_csv_core/pkg/datapos_tool_rust_csv_core.js';

/**
 * Tool configuration.
 */
export const config = {
    id: 'rust-csv-core',
    name: 'Rust CSV Core',
    version: '0.1.0'
} as const;

/**
 * Rust bindings type.
 */
type RustBindings = typeof RustModule;

/**
 * Module variables.
 */
let rustBindingsPromise: Promise<RustBindings> | undefined;

/**
 * CSV processing options.
 */
export interface CsvProcessingOptions {
    delimiter?: string;
    hasHeaders?: boolean;
}

/**
 * CSV processing result summary.
 */
export interface CsvProcessingSummary {
    processedRowCount: number;
    failedRowCount: number;
    durationMs?: number;
}

/**
 * Tool class implementing CSV parsing with Rust core.
 */
class Tool {
    readonly config = config;

    /**
     * Process CSV data using transferable ReadableStream (Chromium path).
     */
    async processWithTransferableStream(
        stream: ReadableStream<Uint8Array>,
        options: CsvProcessingOptions = {},
        onProgress?: (rowCount: number) => void
    ): Promise<CsvProcessingSummary> {
        console.log(1111, stream, options);
        const xxxx = await loadRustBindings();
        console.log('xxxx1', xxxx);
        console.log('xxxx2', xxxx.default);
        console.log('xxxx3', xxxx.stream_csv);
        console.log(2222);
        const delimiter = options.delimiter?.charCodeAt(0) ?? 44; // Default comma
        const hasHeaders = options.hasHeaders ?? true;

        const startTime = performance.now();
        let processedRowCount = 0;

        const progressCallback = (count: number): void => {
            processedRowCount += count;
            if (onProgress) onProgress(count);
        };

        try {
            console.log(3333, delimiter, hasHeaders);
            await xxxx.stream_csv(stream, progressCallback, delimiter, hasHeaders);
            console.log(4444);
            return {
                processedRowCount,
                failedRowCount: 0,
                durationMs: performance.now() - startTime
            };
        } catch (error) {
            throw new OperationalError('Failed to process CSV stream.', 'datapos-tool-rust-csv-core|Tool|processWithTransferableStream', { cause: error });
        }
    }

    /**
     * Process CSV data using chunk-by-chunk approach (Safari fallback).
     */
    async processWithChunks(stream: ReadableStream<Uint8Array>, options: CsvProcessingOptions = {}, onProgress?: (rowCount: number) => void): Promise<CsvProcessingSummary> {
        const { CsvSession } = await loadRustBindings();
        const delimiter = options.delimiter?.charCodeAt(0) ?? 44;
        const hasHeaders = options.hasHeaders ?? true;

        const startTime = performance.now();
        let processedRowCount = 0;
        const session = new CsvSession(delimiter, hasHeaders);

        try {
            const reader = stream.getReader();

            try {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    if (value) {
                        const rows = session.pushChunk(value);
                        const count = Array.isArray(rows) ? rows.length : 0;
                        processedRowCount += count;
                        if (onProgress && count > 0) onProgress(count);
                    }
                }

                // Finish processing
                const remainingRows = session.finish();
                const remainingCount = Array.isArray(remainingRows) ? remainingRows.length : 0;
                processedRowCount += remainingCount;
                if (onProgress && remainingCount > 0) onProgress(remainingCount);

                return {
                    processedRowCount,
                    failedRowCount: 0,
                    durationMs: performance.now() - startTime
                };
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            throw new OperationalError('Failed to process CSV chunks.', 'datapos-tool-rust-csv-core|Tool|processWithChunks', { cause: error });
        }
    }
}

/**
 * Load Rust bindings lazily.
 */
async function loadRustBindings(): Promise<RustBindings> {
    if (!rustBindingsPromise) {
        rustBindingsPromise = import('../rust/datapos_tool_rust_csv_core/pkg/datapos_tool_rust_csv_core.js').then(async (module) => {
            await module.default();
            return module;
        });
    }
    return rustBindingsPromise;
}

// Exports.
export { Tool };
