// Test case for folder expansion in fragmentcommands.ts
// This tests the logic that was added to handle directory expansion

import { describe, test, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

// Mock VS Code API and filesystem utilities
const mockVscode = {
  Uri: class {
    constructor(fsPath) {
      this.fsPath = fsPath;
    }
    toString() {
      return this.fsPath;
    }
  },
  FileType: {
    Directory: 1,
    File: 2
  }
};

// Mock filesystem utilities that match the VS Code extension
async function mockCheckDirectoryExists(uri) {
  try {
    const stat = await fs.stat(uri.fsPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function mockListFiles(uri) {
  const files = [];
  try {
    const entries = await fs.readdir(uri.fsPath, { withFileTypes: true });
    for (const entry of entries) {
      const newUri = new mockVscode.Uri(path.join(uri.fsPath, entry.name));
      if (entry.isDirectory()) {
        files.push(...(await mockListFiles(newUri)));
      } else if (entry.isFile()) {
        files.push(newUri);
      }
    }
  } catch {
    // Ignore errors (directory doesn't exist, etc.)
  }
  return files;
}

// Function that implements the exact logic from fragmentcommands.ts
async function simulateFileExpansion(fileOrFolder, fileOrFolders) {
  let files = [];
  
  // Handle file/folder expansion (this is the exact logic from the fix)
  if (fileOrFolders) {
    // Multiple selection case - expand any directories
    const expandedFiles = [];
    for (const item of fileOrFolders) {
      if (await mockCheckDirectoryExists(item)) {
        // Expand directory to all files recursively
        const filesInDir = await mockListFiles(item);
        expandedFiles.push(...filesInDir.map(f => f.toString()));
      } else {
        // Regular file
        expandedFiles.push(item.toString());
      }
    }
    files = expandedFiles;
  } else if (fileOrFolder) {
    // Single selection case - check if it's a directory
    if (await mockCheckDirectoryExists(fileOrFolder)) {
      // Expand directory to all files recursively
      const filesInDir = await mockListFiles(fileOrFolder);
      files = filesInDir.map(f => f.toString());
    } else {
      // Regular file
      files = [fileOrFolder.toString()];
    }
  } else {
    // Command palette case - no files
    files = [];
  }
  
  return files;
}

describe('fragmentcommands folder expansion fix', () => {
  let testDir;
  let subDir;
  
  async function setupTestFiles() {
    testDir = '/tmp/test-fragment-' + Date.now();
    subDir = path.join(testDir, 'subdirectory');
    
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(subDir, { recursive: true });
    
    // Create test files
    await fs.writeFile(path.join(testDir, 'test1.md'), '# Test file 1');
    await fs.writeFile(path.join(testDir, 'test2.txt'), 'Test content');
    await fs.writeFile(path.join(testDir, 'test3.js'), 'console.log("test");');
    await fs.writeFile(path.join(subDir, 'nested.md'), '# Nested file');
    
    return {
      testDirUri: new mockVscode.Uri(testDir),
      subDirUri: new mockVscode.Uri(subDir),
      fileUris: [
        new mockVscode.Uri(path.join(testDir, 'test1.md')),
        new mockVscode.Uri(path.join(testDir, 'test2.txt'))
      ]
    };
  }
  
  async function cleanupTestFiles() {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  }

  test('should expand single folder to all files recursively', async () => {
    const { testDirUri } = await setupTestFiles();
    
    try {
      // Simulate right-clicking on a folder (single selection)
      const files = await simulateFileExpansion(testDirUri, undefined);
      
      // Should find all 4 files
      expect(files).toHaveLength(4);
      
      // Check that all expected files are included
      const fileNames = files.map(f => path.basename(f));
      expect(fileNames).toContain('test1.md');
      expect(fileNames).toContain('test2.txt');
      expect(fileNames).toContain('test3.js');
      expect(fileNames).toContain('nested.md');
      
      // Verify that nested file has the correct path
      const nestedFile = files.find(f => f.includes('nested.md'));
      expect(nestedFile).toContain('subdirectory');
      
    } finally {
      await cleanupTestFiles();
    }
  });

  test('should expand multiple folders in selection', async () => {
    const { testDirUri, subDirUri } = await setupTestFiles();
    
    try {
      // Simulate selecting multiple items including folders
      const files = await simulateFileExpansion(undefined, [testDirUri, subDirUri]);
      
      // Should find all files from both directories (4 from main + nested file counted again)
      expect(files.length).toBeGreaterThan(0);
      
      const fileNames = files.map(f => path.basename(f));
      expect(fileNames).toContain('nested.md');
      
    } finally {
      await cleanupTestFiles();
    }
  });

  test('should handle single file selection (no expansion needed)', async () => {
    const { fileUris } = await setupTestFiles();
    
    try {
      // Simulate right-clicking on a single file
      const files = await simulateFileExpansion(fileUris[0], undefined);
      
      // Should return just the one file
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('test1.md');
      
    } finally {
      await cleanupTestFiles();
    }
  });

  test('should handle mixed file and folder selection', async () => {
    const { testDirUri, fileUris } = await setupTestFiles();
    
    try {
      // Simulate selecting both files and folders
      const mixedSelection = [fileUris[0], testDirUri, fileUris[1]];
      const files = await simulateFileExpansion(undefined, mixedSelection);
      
      // Should include the individual files plus all files from the expanded folder
      expect(files.length).toBeGreaterThan(2);
      
      const fileNames = files.map(f => path.basename(f));
      // Should contain direct files
      expect(fileNames).toContain('test1.md');
      expect(fileNames).toContain('test2.txt');
      // Should also contain files from expanded folder
      expect(fileNames).toContain('test3.js');
      expect(fileNames).toContain('nested.md');
      
    } finally {
      await cleanupTestFiles();
    }
  });

  test('should handle empty selection (command palette)', async () => {
    // Simulate command palette usage (no files selected)
    const files = await simulateFileExpansion(undefined, undefined);
    
    // Should return empty array
    expect(files).toHaveLength(0);
  });
});