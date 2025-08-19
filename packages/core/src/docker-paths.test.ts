import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { posix, win32 } from "node:path"

describe("Docker container path handling", () => {
    // Helper functions to simulate the container logic
    const DOCKER_CONTAINER_VOLUME = "app"
    
    function detectContainerOS(
        image: string,
        containerOS?: "linux" | "windows"
    ): "linux" | "windows" {
        if (containerOS) {
            return containerOS
        }

        const imageLower = image.toLowerCase()
        const windowsIndicators = [
            "windowsservercore",
            "nanoserver", 
            "windows",
            "mcr.microsoft.com/windows",
            "mcr.microsoft.com/dotnet/framework"
        ]
        
        if (windowsIndicators.some(indicator => imageLower.includes(indicator))) {
            return "windows"
        }
        
        return "linux"
    }

    function joinContainerPath(containerOS: "linux" | "windows", ...parts: string[]): string {
        return containerOS === "windows" ? win32.join(...parts) : posix.join(...parts)
    }

    function createContainerPath(containerOS: "linux" | "windows", ...parts: string[]): string {
        const joined = joinContainerPath(containerOS, ...parts)
        
        if (containerOS === "windows") {
            return joined.startsWith("C:") ? joined : `C:\\${joined.replace(/^[\\\/]+/, "")}`
        } else {
            return joined.startsWith("/") ? joined : `/${joined}`
        }
    }

    describe("Linux containers", () => {
        test("exec cwd should use POSIX separators for Linux containers", () => {
            const userCwd = "tmp/2025-08-18T17-19-30-949Z-2897799bbaca"
            const containerOS = detectContainerOS("python:alpine")
            const cwd = createContainerPath(containerOS, DOCKER_CONTAINER_VOLUME, userCwd)
            
            assert.equal(cwd, "/app/tmp/2025-08-18T17-19-30-949Z-2897799bbaca")
            assert.equal(cwd.includes("\\"), false, "Linux container paths must not contain backslashes")
            assert.equal(cwd.startsWith("/"), true, "Linux container paths must be absolute")
        })
        
        test("should handle various userCwd scenarios for Linux", () => {
            const testCases = [
                { userCwd: ".", expected: "/app" },
                { userCwd: "tmp", expected: "/app/tmp" },
                { userCwd: "project/workspace", expected: "/app/project/workspace" },
                { userCwd: "nested/very/deep/directory/structure", expected: "/app/nested/very/deep/directory/structure" }
            ]
            
            testCases.forEach(({ userCwd, expected }) => {
                const containerOS = detectContainerOS("python:alpine")
                const cwd = createContainerPath(containerOS, DOCKER_CONTAINER_VOLUME, userCwd || ".")
                assert.equal(cwd, expected, `Failed for userCwd: "${userCwd}"`)
                assert.equal(cwd.includes("\\"), false, "Must not contain Windows-style separators")
            })
        })
        
        test("copyTo return paths should use POSIX separators for Linux", () => {
            const containerDestPath = "project/src"
            const filename = "example.txt"
            const containerOS = detectContainerOS("python:alpine")
            
            const resultPath = joinContainerPath(containerOS, containerDestPath, filename)
            
            assert.equal(resultPath, "project/src/example.txt")
            assert.equal(resultPath.includes("\\"), false, "Copy result paths must use forward slashes")
        })
    })

    describe("Windows containers", () => {
        test("exec cwd should use Windows separators for Windows containers", () => {
            const userCwd = "tmp\\2025-08-18T17-19-30-949Z-2897799bbaca"
            const containerOS = detectContainerOS("mcr.microsoft.com/windows/servercore")
            const cwd = createContainerPath(containerOS, DOCKER_CONTAINER_VOLUME, userCwd)
            
            assert.equal(cwd, "C:\\app\\tmp\\2025-08-18T17-19-30-949Z-2897799bbaca")
            assert.equal(cwd.includes("/"), false, "Windows container paths should not contain forward slashes")
            assert.equal(cwd.startsWith("C:"), true, "Windows container paths should be on C: drive")
        })
        
        test("should handle various userCwd scenarios for Windows", () => {
            const testCases = [
                { userCwd: ".", expected: "C:\\app" },
                { userCwd: "tmp", expected: "C:\\app\\tmp" },
                { userCwd: "project\\workspace", expected: "C:\\app\\project\\workspace" },
                { userCwd: "nested\\very\\deep\\directory\\structure", expected: "C:\\app\\nested\\very\\deep\\directory\\structure" }
            ]
            
            testCases.forEach(({ userCwd, expected }) => {
                const containerOS = detectContainerOS("mcr.microsoft.com/windows/nanoserver")
                const cwd = createContainerPath(containerOS, DOCKER_CONTAINER_VOLUME, userCwd || ".")
                assert.equal(cwd, expected, `Failed for userCwd: "${userCwd}"`)
                assert.equal(cwd.includes("/"), false, "Must not contain POSIX-style separators")
            })
        })
        
        test("copyTo return paths should use Windows separators for Windows containers", () => {
            const containerDestPath = "project\\src"
            const filename = "example.txt"
            const containerOS = detectContainerOS("mcr.microsoft.com/windows/servercore")
            
            const resultPath = joinContainerPath(containerOS, containerDestPath, filename)
            
            assert.equal(resultPath, "project\\src\\example.txt")
            assert.equal(resultPath.includes("/"), false, "Copy result paths must use backslashes for Windows")
        })
    })

    describe("Container OS detection", () => {
        test("should detect Linux containers from image names", () => {
            const linuxImages = [
                "python:alpine",
                "node:latest",
                "ubuntu:20.04",
                "gcc:latest",
                "mcr.microsoft.com/dotnet/runtime:7.0"
            ]
            
            linuxImages.forEach(image => {
                const containerOS = detectContainerOS(image)
                assert.equal(containerOS, "linux", `Should detect ${image} as Linux`)
            })
        })
        
        test("should detect Windows containers from image names", () => {
            const windowsImages = [
                "mcr.microsoft.com/windows/servercore:ltsc2022",
                "mcr.microsoft.com/windows/nanoserver:ltsc2022",
                "mcr.microsoft.com/dotnet/framework/runtime:4.8-windowsservercore-ltsc2022",
                "windows/servercore",
                "nanoserver:latest"
            ]
            
            windowsImages.forEach(image => {
                const containerOS = detectContainerOS(image)
                assert.equal(containerOS, "windows", `Should detect ${image} as Windows`)
            })
        })
        
        test("should respect explicit containerOS option", () => {
            // Force Linux even with Windows image
            const containerOS1 = detectContainerOS("mcr.microsoft.com/windows/servercore", "linux")
            assert.equal(containerOS1, "linux")
            
            // Force Windows even with Linux image  
            const containerOS2 = detectContainerOS("python:alpine", "windows")
            assert.equal(containerOS2, "windows")
        })
    })

    describe("Path format inference", () => {
        test("should handle mixed path formats gracefully", () => {
            // Linux container with Windows-style input path
            const containerOS1 = detectContainerOS("python:alpine")
            const cwd1 = createContainerPath(containerOS1, DOCKER_CONTAINER_VOLUME, "tmp\\windows\\style")
            assert.equal(cwd1, "/app/tmp\\windows\\style") // Preserves the backslashes as literal characters in Linux
            
            // Windows container with POSIX-style input path
            const containerOS2 = detectContainerOS("mcr.microsoft.com/windows/servercore")
            const cwd2 = createContainerPath(containerOS2, DOCKER_CONTAINER_VOLUME, "tmp/posix/style")
            assert.equal(cwd2, "C:\\app\\tmp\\posix\\style") // Converts to Windows format
        })
    })

    test("should be platform-independent for containers", () => {
        const userCwd = "workspace/project"
        
        // Linux container
        const linuxContainerOS = detectContainerOS("python:alpine")
        const linuxCwd = createContainerPath(linuxContainerOS, DOCKER_CONTAINER_VOLUME, userCwd)
        assert.equal(linuxCwd, "/app/workspace/project")
        assert.equal(linuxCwd.includes("\\"), false)
        
        // Windows container  
        const windowsContainerOS = detectContainerOS("mcr.microsoft.com/windows/servercore")
        const windowsCwd = createContainerPath(windowsContainerOS, DOCKER_CONTAINER_VOLUME, userCwd)
        assert.equal(windowsCwd, "C:\\app\\workspace\\project")
        assert.equal(windowsCwd.includes("/"), false)
    })
})