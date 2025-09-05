
export interface PythonRuntimeOptions {
  cache?: string;
}

export interface PythonRuntime {
  /**
   * Runs python code and returns the result
   * @param code python code
   */
  run(code: string): Promise<any>;

  /**
   * Imports a package using micropip
   * @param pkg name and version
   */
  import(pkg: string): Promise<void>;

  /**
   * Access to python global variables
   */
  globals: PythonProxy;
}

export interface PythonProxy {
  /**
   * Reads a value from the python object
   * @param name
   */
  get<T>(name: string): T;
  /**
   * Copy a value into the python object
   * @param name
   * @param value
   */
  set<T>(name: string, value: T): void;
}
