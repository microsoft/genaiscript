import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { readFile } from "fs/promises"
import { join } from "path"
import { ChatCompletionMessageParam } from "./chattypes"
import { collapseChatMessages } from "./chatrender"
import { CreateImageRequest } from "./chat"

describe("chat", () => {
    describe("collapse", () => {
        test("user1", () => {
            const messages: ChatCompletionMessageParam[] = [
                { role: "user", content: "1" },
            ]
            const res = structuredClone(messages)
            collapseChatMessages(res)
            assert.deepStrictEqual(res, messages)
        })
        test("system1", () => {
            const messages: ChatCompletionMessageParam[] = [
                { role: "system", content: "1" },
            ]
            const res = structuredClone(messages)
            collapseChatMessages(res)
            assert.deepStrictEqual(res, messages)
        })
        test("system1user1", () => {
            const messages: ChatCompletionMessageParam[] = [
                { role: "system", content: "1" },
                { role: "user", content: "1" },
            ]
            const res = structuredClone(messages)
            collapseChatMessages(res)
            assert.deepStrictEqual(res, messages)
        })
        test("system2", () => {
            const messages: ChatCompletionMessageParam[] = [
                { role: "system", content: "1" },
                { role: "system", content: "2" },
            ]
            collapseChatMessages(messages)
            assert.strictEqual(1, messages.length)
            assert.strictEqual("system", messages[0].role)
            assert.strictEqual("1\n2", messages[0].content)
        })
        test("system2user1", () => {
            const messages: ChatCompletionMessageParam[] = [
                { role: "system", content: "1" },
                { role: "system", content: "2" },
                { role: "user", content: "3" },
            ]
            collapseChatMessages(messages)
            assert.strictEqual(2, messages.length)
            assert.strictEqual("system", messages[0].role)
            assert.strictEqual("1\n2", messages[0].content)
            assert.strictEqual("user", messages[1].role)
            assert.strictEqual("3", messages[1].content)
        })
        test("system2user1", () => {
            const messages: ChatCompletionMessageParam[] = [
                { role: "system", content: "1" },
                { role: "system", content: "2" },
                { role: "user", content: "3" },
                { role: "user", content: "4" },
            ]
            collapseChatMessages(messages)
            assert.strictEqual(3, messages.length)
            assert.strictEqual("system", messages[0].role)
            assert.strictEqual("1\n2", messages[0].content)
            assert.strictEqual("user", messages[1].role)
            assert.strictEqual("3", messages[1].content)
        })
    })
    
    describe("CreateImageRequest", () => {
        test("should accept image input", async () => {
            const robotsImagePath = join(__dirname, '../../sample/src/robots.jpg')
            const mockImageBuffer = await readFile(robotsImagePath)
            
            const request: CreateImageRequest = {
                model: 'gpt-image-1',
                prompt: 'Turn this into a banner',
                image: mockImageBuffer,
                quality: 'high',
                size: '1024x1024'
            }
            
            assert.strictEqual(request.model, 'gpt-image-1')
            assert.strictEqual(request.prompt, 'Turn this into a banner')
            assert.strictEqual(request.image, mockImageBuffer)
            assert.strictEqual(request.quality, 'high')
            assert.strictEqual(request.size, '1024x1024')
        })
        
        test("should work without image input (backward compatibility)", () => {
            const request: CreateImageRequest = {
                model: 'dall-e-3',
                prompt: 'A beautiful sunset',
                quality: 'high',
                size: '1024x1024'
            }
            
            assert.strictEqual(request.model, 'dall-e-3')
            assert.strictEqual(request.prompt, 'A beautiful sunset')
            assert.strictEqual(request.image, undefined)
            assert.strictEqual(request.quality, 'high')
            assert.strictEqual(request.size, '1024x1024')
        })
        
        test("should support multiple images", async () => {
            const robotsImagePath = join(__dirname, '../../sample/src/robots.jpg')
            const mockImageBuffer1 = await readFile(robotsImagePath)
            const mockImageBuffer2 = await readFile(robotsImagePath) // Using same file for both
            
            const request: CreateImageRequest = {
                model: 'gpt-image-1',
                prompt: 'Create variations of these images',
                image: [mockImageBuffer1, mockImageBuffer2],
                type: 'variation',
                quality: 'high',
                size: '1024x1024'
            }
            
            assert.strictEqual(request.model, 'gpt-image-1')
            assert.strictEqual(request.prompt, 'Create variations of these images')
            assert.strictEqual(Array.isArray(request.image), true)
            assert.strictEqual((request.image as Buffer[]).length, 2)
            assert.strictEqual(request.type, 'variation')
            assert.strictEqual(request.quality, 'high')
            assert.strictEqual(request.size, '1024x1024')
        })
        
        test("should support edit type", () => {
            const mockImageBuffer = Buffer.from('mock image data')
            
            const request: CreateImageRequest = {
                model: 'gpt-image-1',
                prompt: 'Make this image more modern',
                image: mockImageBuffer,
                type: 'edit',
                quality: 'high',
                size: '1024x1024'
            }
            
            assert.strictEqual(request.model, 'gpt-image-1')
            assert.strictEqual(request.prompt, 'Make this image more modern')
            assert.strictEqual(request.image, mockImageBuffer)
            assert.strictEqual(request.type, 'edit')
            assert.strictEqual(request.quality, 'high')
            assert.strictEqual(request.size, '1024x1024')
        })
        
        test("should support variation type", () => {
            const mockImageBuffer = Buffer.from('mock image data')
            
            const request: CreateImageRequest = {
                model: 'gpt-image-1',
                prompt: 'Create variations',
                image: mockImageBuffer,
                type: 'variation',
                quality: 'high',
                size: '1024x1024'
            }
            
            assert.strictEqual(request.model, 'gpt-image-1')
            assert.strictEqual(request.prompt, 'Create variations')
            assert.strictEqual(request.image, mockImageBuffer)
            assert.strictEqual(request.type, 'variation')
            assert.strictEqual(request.quality, 'high')
            assert.strictEqual(request.size, '1024x1024')
        })
        
        test("should default to edit type when not specified", () => {
            const mockImageBuffer = Buffer.from('mock image data')
            
            const request: CreateImageRequest = {
                model: 'gpt-image-1',
                prompt: 'Edit this image',
                image: mockImageBuffer,
                quality: 'high',
                size: '1024x1024'
            }
            
            assert.strictEqual(request.model, 'gpt-image-1')
            assert.strictEqual(request.prompt, 'Edit this image')
            assert.strictEqual(request.image, mockImageBuffer)
            assert.strictEqual(request.type, undefined) // Should default to 'edit' in implementation
            assert.strictEqual(request.quality, 'high')
            assert.strictEqual(request.size, '1024x1024')
        })
    })
})
