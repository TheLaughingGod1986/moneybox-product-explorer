# Using PRD with Cursor AI

This guide explains how to leverage the Product Requirements Document (PRD) files with Cursor AI for enhanced development assistance.

## Files Overview

- **`PRD.md`** - Human-readable comprehensive requirements document
- **`PRD.json`** - Machine-readable structured requirements for AI assistance

## How to Use with Cursor

### 1. Project Context Setup

When starting a new session or asking Cursor for help, reference the PRD:

```
@PRD.json help me implement the image upload feature described in the requirements
```

### 2. Feature Development

Use the PRD to guide feature implementation:

```
Based on the user stories in PRD.json, help me create the CategoryCard component with all the acceptance criteria
```

### 3. Code Review & Quality Gates

Reference quality requirements when reviewing code:

```
@PRD.json check if this component meets the accessibility requirements and performance standards defined in the PRD
```

### 4. Testing Guidance

Use testing requirements for comprehensive test coverage:

```
@PRD.json generate unit tests for the ProductExplorer component based on the testing requirements
```

### 5. API Implementation

Reference API specifications for consistent implementation:

```
@PRD.json help me implement the POST /api/categories endpoint according to the API specification
```

## Key Sections for Cursor

### Most Useful Sections:

1. **`functional_requirements`** - Feature specifications and acceptance criteria
2. **`user_stories`** - Detailed user requirements with priorities
3. **`technical_requirements`** - Architecture and performance specifications
4. **`data_models`** - Schema definitions for consistent data handling
5. **`api_endpoints`** - API specifications with request/response formats
6. **`ui_components`** - Component specifications with props and behavior
7. **`testing_requirements`** - Comprehensive testing standards
8. **`quality_gates`** - Code quality and performance standards

### Example Cursor Commands:

```bash
# Feature Development
"@PRD.json implement the admin panel component according to the specifications"

# Bug Fixes
"@PRD.json this component isn't meeting the performance requirements, help me optimize it"

# Testing
"@PRD.json create integration tests for the API endpoints as specified"

# Code Review
"@PRD.json review this code against the technical requirements and quality gates"

# Documentation
"@PRD.json help me update the component documentation to match the PRD specifications"
```

## Benefits

- **Consistency**: Ensures all development aligns with requirements
- **Completeness**: Cursor knows about all features, not just current context
- **Quality**: AI can check against defined standards and best practices
- **Efficiency**: Reduces back-and-forth by providing complete context upfront
- **Accuracy**: Structured requirements prevent misunderstanding of business needs

## Tips for Best Results

1. **Reference specific sections** when asking for help
2. **Mention priority levels** (P0, P1, P2) for feature prioritization
3. **Include acceptance criteria** when implementing features
4. **Reference quality gates** when optimizing or reviewing code
5. **Use user stories** to understand the "why" behind features

This structured approach ensures that Cursor has complete context about your project requirements and can provide more accurate, consistent assistance throughout the development process.