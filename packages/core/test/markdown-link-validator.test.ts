// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect } from "vitest";

describe("markdown-reference-link-validation", () => {
    test("should extract reference links using regex", () => {
        const content = `# Test Document

Here are some links: [GitHub] and [Google].

## References

[GitHub]: https://github.com "GitHub Homepage"
[Google]: https://www.google.com
[Microsoft]: https://www.microsoft.com "Microsoft Corporation"
[invalid]: not-a-url
[local]: ./relative/path.md
[Domain]: example.com
`;

        // Match reference link definitions: [label]: url "optional title"
        // URL should start with http:// or https:// or be a valid relative path or domain
        const refLinkRegex = /^\s*\[([^\]]+)\]:\s+((?:https?:\/\/|\.?\/)[^\s]+|\S+\.[a-zA-Z]{2,})(?:\s+"([^"]*)")?\s*$/gm;
        const links: Array<{label: string, url: string, title?: string}> = [];
        let match;
        
        while ((match = refLinkRegex.exec(content)) !== null) {
            const [, label, url, title] = match;
            links.push({
                label: label.toLowerCase(),
                url: url,
                title: title || undefined,
            });
        }

        expect(links).toHaveLength(5);
        expect(links.find(l => l.label === "github")).toEqual({
            label: "github",
            url: "https://github.com",
            title: "GitHub Homepage"
        });
        expect(links.find(l => l.label === "google")).toEqual({
            label: "google",
            url: "https://www.google.com",
            title: undefined
        });
        expect(links.find(l => l.label === "microsoft")).toEqual({
            label: "microsoft",
            url: "https://www.microsoft.com",
            title: "Microsoft Corporation"
        });
        expect(links.find(l => l.label === "local")).toEqual({
            label: "local",
            url: "./relative/path.md",
            title: undefined
        });
        expect(links.find(l => l.label === "domain")).toEqual({
            label: "domain",
            url: "example.com",
            title: undefined
        });
        
        // Should not include invalid URLs
        expect(links.find(l => l.label === "invalid")).toBeUndefined();
    });

    test("should validate URL format correctly", () => {
        const isValidUrl = (url: string): boolean => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        };

        expect(isValidUrl("https://example.com")).toBe(true);
        expect(isValidUrl("http://example.com")).toBe(true);
        expect(isValidUrl("ftp://example.com")).toBe(true);
        expect(isValidUrl("not-a-url")).toBe(false);
        expect(isValidUrl("output.text")).toBe(false);
        expect(isValidUrl("")).toBe(false);
        expect(isValidUrl("./relative/path")).toBe(false); // Relative paths aren't valid URLs
    });

    test("should categorize link validation results correctly", () => {
        interface LinkResult {
            label: string;
            url: string;
            status: "valid" | "broken" | "mismatch" | "timeout" | "invalid";
            statusCode?: number;
            actualTitle?: string;
            title?: string;
        }

        const results: LinkResult[] = [
            { label: "working", url: "https://example.com", status: "valid", statusCode: 200 },
            { label: "broken", url: "https://broken.example", status: "broken", statusCode: 404 },
            { label: "mismatch", url: "https://example.com", status: "mismatch", title: "Expected", actualTitle: "Actual" },
            { label: "timeout", url: "https://slow.example", status: "timeout" },
            { label: "invalid", url: "not-a-url", status: "invalid" }
        ];

        const validLinks = results.filter(r => r.status === "valid");
        const brokenLinks = results.filter(r => 
            r.status === "broken" || r.status === "timeout" || r.status === "invalid"
        );
        const contentMismatches = results.filter(r => r.status === "mismatch");

        expect(validLinks).toHaveLength(1);
        expect(brokenLinks).toHaveLength(3);
        expect(contentMismatches).toHaveLength(1);
    });
});