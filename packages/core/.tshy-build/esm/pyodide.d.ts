import { TraceOptions } from "./trace.js";
import type { PythonRuntime, PythonRuntimeOptions } from "./types.js";
/**
 * Creates and initializes a Python runtime environment using Pyodide.
 *
 * @param options - Optional settings to configure the Python runtime and tracing behavior.
 *   - cache: Controls caching behavior for loaded Python packages.
 *   - trace options: Options for enabling and handling tracing during runtime operations.
 * @returns A Promise resolving to an instance of the Python runtime environment.
 *
 * The function sets up Pyodide, configures caching, handles package installations,
 * and mounts the current workspace directory. The created runtime allows execution
 * of Python code and interaction with Python globals.
 */
export declare function createPythonRuntime(options?: PythonRuntimeOptions & TraceOptions): Promise<PythonRuntime>;
//# sourceMappingURL=pyodide.d.ts.map