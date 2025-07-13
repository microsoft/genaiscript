// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Boolean indicating if debug messages should be suppressed
// Controls whether debug messages are outputted
export let isQuiet = false;

/**
 * Sets the quiet mode for suppressing debug messages.
 * @param v - Boolean to enable or disable quiet mode
 */
export function setQuiet(v: boolean) {
  isQuiet = !!v;
}
