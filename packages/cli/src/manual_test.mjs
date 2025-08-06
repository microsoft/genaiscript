// Manual test to verify the fix
import { NodeHost } from './nodehost.js'

async function main() {
    console.log("Testing NodeHost.exec exit code preservation...")
    const host = new NodeHost()
    
    try {
        console.log("1. Testing 'false' command (expect exit code 1)...")
        const result1 = await host.exec("", "false", [], {})
        console.log(`   exitCode: ${result1.exitCode}, failed: ${result1.failed}`)
        
        console.log("2. Testing 'sh -c exit 2' command (expect exit code 2)...")
        const result2 = await host.exec("", "sh", ["-c", "exit 2"], {})
        console.log(`   exitCode: ${result2.exitCode}, failed: ${result2.failed}`)
        
        console.log("3. Testing 'echo hello' command (expect exit code 0)...")
        const result3 = await host.exec("", "echo", ["hello"], {})
        console.log(`   exitCode: ${result3.exitCode}, failed: ${result3.failed}, stdout: '${result3.stdout.trim()}'`)
        
        const success = result1.exitCode === 1 && result2.exitCode === 2 && result3.exitCode === 0
        console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed!'}`)
        console.log(`Exit codes: [${result1.exitCode}, ${result2.exitCode}, ${result3.exitCode}] (expected: [1, 2, 0])`)
        
    } catch (error) {
        console.error("Error:", error)
    }
}

main()