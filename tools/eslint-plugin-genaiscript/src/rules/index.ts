// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file All rules
 */

import githubSourceHeaders from "./github-source-headers.js";
import tsPackageJsonAuthor from "./ts-package-json-author.js";
import tsPackageJsonBugs from "./ts-package-json-bugs.js";
import tsPackageJsonEngineIsPresent from "./ts-package-json-engine-is-present.js";
import tsPackageJsonHomepage from "./ts-package-json-homepage.js";
import tsPackageJsonRepo from "./ts-package-json-repo.js";
import tsVersioningSemver from "./ts-versioning-semver.js";
import tsPackageJsonLicense from "./ts-package-json-license.js";  


/**
 * An object containing all rules defined by the plugin
 */
export default {
  "github-source-headers": githubSourceHeaders,
  "ts-package-json-author": tsPackageJsonAuthor,
  "ts-package-json-bugs": tsPackageJsonBugs,
  "ts-package-json-engine-is-present": tsPackageJsonEngineIsPresent,
  "ts-package-json-homepage": tsPackageJsonHomepage,
  "ts-package-json-license": tsPackageJsonLicense,
  "ts-versioning-semver": tsVersioningSemver,
  "ts-package-json-repo": tsPackageJsonRepo,
};
