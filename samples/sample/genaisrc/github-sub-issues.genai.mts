script({
    title: "GitHub Sub-Issues Demo",
    description: "Demonstrates creating GitHub sub-issues using the parentIssue feature",
    parameters: {
        epicTitle: {
            type: "string",
            description: "Title for the parent epic issue",
            default: "Epic: New Feature Development"
        },
        epicDescription: {
            type: "string", 
            description: "Description for the parent epic",
            default: "This epic tracks the development of a new feature with multiple sub-tasks."
        }
    }
});

// Get parameters with defaults
const epicTitle = env.vars.epicTitle
const epicDescription = env.vars.epicDescription 

console.log("🎯 Creating GitHub Epic and Sub-Issues Demo");

try {
    // First, create the parent epic issue
    console.log("📝 Creating parent epic issue...");
    const parentEpic = await github.createIssue(
        epicTitle,
        `${epicDescription}

## Overview
This epic will be broken down into multiple sub-tasks to ensure organized development.

## Sub-tasks
The following sub-issues will be created and linked to this epic:
- [ ] Research and planning phase
- [ ] Backend implementation  
- [ ] Frontend development
- [ ] Testing and validation
- [ ] Documentation updates

## Acceptance Criteria
- All sub-issues are completed
- Feature is properly tested
- Documentation is updated
`,
        {
            labels: ["epic", "enhancement"]
        }
    );

    console.log(`✅ Created parent epic: #${parentEpic.number} - ${parentEpic.title}`);

    // Define sub-issues to create
    const subIssues = [
        {
            title: "Research and Planning Phase",
            description: `## Task Description
Conduct research and create detailed planning for the new feature.

## Deliverables
- [ ] Requirements analysis
- [ ] Technical specification
- [ ] Architecture design
- [ ] Implementation timeline

## Parent Epic
This sub-issue is part of epic #${parentEpic.number}`,
            labels: ["research", "planning", "sub-task"]
        },
        {
            title: "Backend Implementation", 
            description: `## Task Description
Implement the backend components for the new feature.

## Deliverables
- [ ] API endpoints
- [ ] Database schema changes
- [ ] Business logic implementation
- [ ] Unit tests

## Parent Epic
This sub-issue is part of epic #${parentEpic.number}`,
            labels: ["backend", "implementation", "sub-task"]
        },
        {
            title: "Frontend Development",
            description: `## Task Description
Develop the user interface components for the new feature.

## Deliverables  
- [ ] UI components
- [ ] User interactions
- [ ] State management
- [ ] Integration with backend APIs

## Parent Epic
This sub-issue is part of epic #${parentEpic.number}`,
            labels: ["frontend", "ui", "sub-task"]
        },
        {
            title: "Testing and Validation",
            description: `## Task Description
Comprehensive testing of the new feature across all components.

## Deliverables
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Performance testing
- [ ] User acceptance testing

## Parent Epic
This sub-issue is part of epic #${parentEpic.number}`,
            labels: ["testing", "qa", "sub-task"]
        },
        {
            title: "Documentation Updates",
            description: `## Task Description
Update all relevant documentation for the new feature.

## Deliverables
- [ ] API documentation
- [ ] User guides
- [ ] Developer documentation
- [ ] Release notes

## Parent Epic
This sub-issue is part of epic #${parentEpic.number}`,
            labels: ["documentation", "sub-task"]
        }
    ];

    // Create sub-issues linked to the parent epic
    console.log(`📋 Creating ${subIssues.length} sub-issues...`);
    const createdSubIssues = [];

    for (const subIssue of subIssues) {
        console.log(`  🔄 Creating: ${subIssue.title}`);
        
        const createdIssue = await github.createIssue(
            subIssue.title,
            subIssue.description,
            {
                labels: subIssue.labels,
                parentIssue: parentEpic.number  // 🌟 This is the new parentIssue feature!
            }
        );
        
        createdSubIssues.push(createdIssue);
        console.log(`  ✅ Created sub-issue: #${createdIssue.number} - ${createdIssue.title}`);
    }

    // Summary
    console.log("\n🎉 Demo completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`  • Parent Epic: #${parentEpic.number} - ${parentEpic.title}`);
    console.log(`  • Sub-Issues Created: ${createdSubIssues.length}`);
    createdSubIssues.forEach(issue => {
        console.log(`    - #${issue.number}: ${issue.title}`);
    });

    console.log(`\n🔗 View the parent epic at: ${parentEpic.html_url}`);
    console.log("\n💡 The sub-issues are now linked to the parent epic and will appear in the task list!");

} catch (error) {
    console.error("❌ Error creating issues:", error.message);
    console.log("Make sure you have write access to the repository and GitHub integration is properly configured.");
}