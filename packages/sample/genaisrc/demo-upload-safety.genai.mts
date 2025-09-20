// Example demonstrating the upload asset safety system

script({
    title: "Demo: Upload Asset Safety",
    system: ["system.safety_upload_assets"],
})

// This example shows how the safety system protects upload operations

// 1. Safe upload (will add warning but allow operation)
$`Create code that uploads a simple text file using github.uploadAsset`

// 2. Unsafe upload with API key (will be blocked)
$`Create code that uploads a file containing an API key like "sk-1234567890abcdef" using github.uploadAsset`

// 3. Upload with proper validation
$`Create code that validates file content for secrets before uploading with github.uploadAsset`