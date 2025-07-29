# Contributing to Lithium Battery Recycling Dashboard

Thank you for your interest in contributing to the Lithium Battery Recycling Dashboard! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/Lithium_2025-main.git
   cd Lithium_2025-main
   ```

2. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set Up Environment**
   - Configure Supabase credentials
   - Set up local database (optional)
   - Configure environment variables

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new components and utilities
- **Formatting**: Code is automatically formatted with ESLint
- **Naming Conventions**:
  - Components: PascalCase (`FacilityCard.tsx`)
  - Files: camelCase (`facilityUtils.ts`)
  - Variables: camelCase (`facilityData`)
  - Constants: UPPER_SNAKE_CASE (`MAX_FACILITIES`)

### Component Structure

```typescript
// Component template
import React from 'react';
import './ComponentName.css';

interface ComponentNameProps {
  // Define props with proper types
}

export const ComponentName: React.FC<ComponentNameProps> = ({ 
  prop1, 
  prop2 
}) => {
  // Component logic here
  
  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
};
```

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, documented code
   - Add tests if applicable
   - Update documentation

3. **Commit Messages**
   Follow conventional commit format:
   ```
   feat: add facility filtering by capacity
   fix: resolve map marker positioning issue
   docs: update API documentation
   style: improve component CSS styling
   refactor: optimize facility data processing
   test: add unit tests for utility functions
   chore: update dependencies
   ```

4. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🧪 Testing

### Running Tests
```bash
npm run test        # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Writing Tests
- Place test files next to the component: `Component.test.tsx`
- Use descriptive test names
- Test both happy paths and edge cases
- Mock external dependencies

Example test structure:
```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly with props', () => {
    render(<ComponentName prop1="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## 📦 Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── facility/       # Facility-specific components
│   └── forms/          # Form components
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── services/           # API and data services
├── context/            # React context providers
└── styles/             # Global styles
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to recreate the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, Node.js version
6. **Screenshots**: If applicable

## 💡 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the feature** and its use case
3. **Explain the benefits** to users
4. **Consider implementation** complexity
5. **Provide mockups** if UI-related

## 🔍 Code Review Process

### Pull Request Requirements

- [ ] Code follows project conventions
- [ ] Tests pass and coverage is maintained
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] TypeScript types are properly defined
- [ ] Component props are documented
- [ ] CSS follows BEM methodology where applicable

### Review Checklist

**Functionality**
- [ ] Feature works as expected
- [ ] Edge cases are handled
- [ ] Error handling is implemented

**Code Quality**
- [ ] Code is readable and well-structured
- [ ] No code duplication
- [ ] Proper separation of concerns
- [ ] Performance considerations

**Testing**
- [ ] Unit tests are included
- [ ] Integration tests where applicable
- [ ] Manual testing completed

## 📚 Resources

### Documentation
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) (if applicable)

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the code of conduct

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to the Lithium Battery Recycling Dashboard! 🎉