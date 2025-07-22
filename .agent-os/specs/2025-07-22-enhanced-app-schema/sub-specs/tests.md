# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-22-enhanced-app-schema/spec.md

> Created: 2025-07-22
> Version: 1.0.0

## Test Coverage

### Unit Tests

**YAML Data Validation**
- Validate that apps with new resource fields load correctly
- Validate that apps without resource fields maintain backward compatibility
- Test URL format validation for each resource type
- Test handling of malformed or empty resource URLs

### Integration Tests

**Template Rendering**
- Verify app pages render correctly with resource links when present
- Verify app pages render correctly without resource section when links are absent
- Test resource link section styling and layout across different screen sizes
- Verify accessibility attributes are properly applied to resource links

**Data Processing**
- Test Jekyll site generation with mixed app entries (some with resources, some without)
- Verify app_generator.rb plugin handles new schema structure correctly
- Test that site builds successfully with various resource field combinations

### Feature Tests

**User Interface**
- End-to-end test of viewing app page with full resource links
- Test resource link clicks navigate to correct external URLs
- Verify resource section displays with proper GNOME HIG styling
- Test responsive behavior on mobile and desktop viewports

**Content Management**
- Test adding new app entries with complete resource metadata
- Verify documentation examples work as specified
- Test edge cases like partial resource information

### Mocking Requirements

- **External URLs:** Mock HTTP responses for URL validation testing to avoid dependency on live external services
- **Jekyll Build Process:** Mock file system operations for testing data loading and template processing in isolation