// Sample script demonstrating the use of host.resolveResource
// This resolves a URL to access resources and their content

script({
  title: "Resource Resolution Example",
  description: "Demonstrates using host.resolveResource to fetch and process remote resources",
  group: "Samples",
})

// URL to resolve - using GitHub favicon as an example
const url = "https://github.com/microsoft/genaiscript/blob/main/docs/public/images/favicon.png"

console.log(`Resolving resource: ${url}`)

try {
  // Use host.resolveResource to resolve the URL
  const result = await host.resolveResource(url)
  
  if (result) {
    console.log(`✅ Successfully resolved resource:`)
    console.log(`   URI: ${result.uri}`)
    console.log(`   Files found: ${result.files.length}`)
    
    // Display information about each resolved file
    for (const file of result.files) {
      console.log(`   📄 File: ${file.filename}`)
      console.log(`      Content type: ${file.content ? 'binary' : 'text'}`)
      
      if (file.content) {
        console.log(`      Size: ${file.content.length} bytes`)
        console.log(`      Content preview: [binary data - ${file.content.slice(0, 20)}...]`)
      } else if (file.text) {
        console.log(`      Size: ${file.text.length} characters`)
        console.log(`      Content preview: ${file.text.slice(0, 100)}...`)
      }
    }
    
    // Example of using the resolved content in a prompt
    if (result.files.length > 0) {
      const file = result.files[0]
      if (file.content) {
        $`Here's information about the resolved image file:
- URL: ${result.uri}
- Filename: ${file.filename}
- Size: ${file.content.length} bytes
- Type: Binary image data

This demonstrates how host.resolveResource can fetch and provide access to remote resources 
including binary files like images, documents, and other content types.`
      }
    }
  } else {
    console.log(`❌ Failed to resolve resource: ${url}`)
    $`Could not resolve the resource at ${url}. This might be due to:
- Invalid URL format
- Network connectivity issues  
- Unsupported protocol
- Resource not found`
  }
} catch (error) {
  console.error(`Error resolving resource:`, error)
  $`An error occurred while trying to resolve the resource: ${error.message}`
}