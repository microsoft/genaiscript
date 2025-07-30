// Create professional banners from icon images
// This script demonstrates creating banners from existing icon/image files

script({
  title: "Banner Creation from Icons",
  description: "Create professional banners using existing images as base",
  group: "Image Generation"
})

// Create a banner from the spider macro photo
const { image } = await generateImage(
  "Create a professional banner with this macro spider photo, add elegant typography saying 'Nature Photography' with a dark, sophisticated background",
  {
    mode: "edit",
    image: "src/images/Spider Macro Photography.jpg",
    model: "openai:gpt-image-1",
    quality: "high",
    size: "landscape"
  }
)

console.log(`🕷️ Generated spider banner: ${image.filename}`)

// Create a tech banner from the Modern Water Tower image
const { image: techBanner } = await generateImage(
  "Transform this into a modern tech company banner, add futuristic elements and the text 'INNOVATION' in a sleek font",
  {
    mode: "edit",
    image: "src/images/Modern Water Tower.jpg", 
    model: "openai:gpt-image-1",
    quality: "high",
    size: "landscape"
  }
)

console.log(`🏗️ Generated tech banner: ${techBanner.filename}`)

// Create a nature banner from the sunset image
const { image: natureBanner } = await generateImage(
  "Create a wellness/meditation banner with this sunset image, add calming text overlay 'MINDFULNESS' with zen-like typography",
  {
    mode: "edit",
    image: "src/images/Minimal. Orange Sea Sunset.jpg",
    model: "openai:gpt-image-1",
    quality: "high", 
    size: "landscape"
  }
)

console.log(`🌅 Generated nature banner: ${natureBanner.filename}`)

// Create a vintage banner from the Prague image
const { image: vintageBanner } = await generateImage(
  "Transform this into a vintage travel poster style banner, add retro typography saying 'PRAGUE' with classic poster aesthetics",
  {
    mode: "edit",
    image: "src/images/Unusual photo of old Prague.jpg",
    model: "openai:gpt-image-1",
    quality: "high",
    size: "landscape"
  }
)

console.log(`🏛️ Generated vintage Prague banner: ${vintageBanner.filename}`)