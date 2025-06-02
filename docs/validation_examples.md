# 🎯 Quick Validation Examples

## **Before vs After: Form Validation Implementation**

### **❌ Before: Basic HTML Input (No Validation)**
```tsx
// Old way - no validation
<input 
  type="text" 
  name="company" 
  placeholder="Company name"
  onChange={handleChange}
  className="form-control"
/>
```

**Problems:**
- No validation feedback
- Can submit empty/invalid data
- No user guidance
- Confusing error messages

### **✅ After: ValidatedInput Component**
```tsx
// New way - with validation
<ValidatedInput
  name="company_name"
  label="Company Name"
  value={formData.company_name}
  onChange={updateField}
  error={getFieldError('company_name')}
  isValid={isFieldValid('company_name')}
  isTouched={isFieldTouched('company_name')}
  required
  placeholder="e.g., Tesla, Li-Cycle, Redwood Materials"
  helpText="The company that owns or operates this facility"
/>
```

**Benefits:**
- ✅ Real-time validation as you type
- ✅ Clear error messages
- ✅ Visual feedback (red/green borders)
- ✅ Helpful examples and guidance
- ✅ Required field indicators

## **🔧 How to Add Validation to Any Field**

### **Step 1: Add to Validation Schema**
```tsx
// In facilityValidation.ts
export const myValidationSchema = {
  'field_name': [
    validationRules.required('This field is required'),
    validationRules.minLength(2, 'Must be at least 2 characters')
  ]
};
```

### **Step 2: Replace HTML Input with ValidatedInput**
```tsx
// Replace this:
<input type="text" name="field_name" />

// With this:
<ValidatedInput
  name="field_name"
  label="Field Label"
  value={formData.field_name}
  onChange={updateField}
  error={getFieldError('field_name')}
  isValid={isFieldValid('field_name')}
  isTouched={isFieldTouched('field_name')}
  required
/>
```

### **Step 3: That's It! 🎉**
You now have:
- Real-time validation
- Error messages
- Visual feedback
- Professional UX

## **🎨 Visual Comparison**

### **Invalid State (Red Border + Error)**
```
Company Name *
┌─────────────────────────────────────┐
│                                   │ ← Red border
└─────────────────────────────────────┘
❌ Company name is required
ℹ️ The company that owns this facility
```

### **Valid State (Green Border + Success)**
```
Company Name *
┌─────────────────────────────────────┐
│ Tesla Motors                      │ ← Green border
└─────────────────────────────────────┘
✅ Looks good!
ℹ️ The company that owns this facility
```

## **⚡ Quick Copy-Paste Templates**

### **Text Input with Validation**
```tsx
<ValidatedInput
  name="your_field_name"
  label="Your Field Label"
  type="text"
  value={formData.your_field_name}
  onChange={updateField}
  error={getFieldError('your_field_name')}
  isValid={isFieldValid('your_field_name')}
  isTouched={isFieldTouched('your_field_name')}
  required
  placeholder="Example value"
  helpText="Helpful description"
/>
```

### **Number Input with Validation**
```tsx
<ValidatedInput
  name="capacity"
  label="Processing Capacity"
  type="number"
  value={formData.capacity}
  onChange={updateField}
  error={getFieldError('capacity')}
  isValid={isFieldValid('capacity')}
  isTouched={isFieldTouched('capacity')}
  required
  placeholder="e.g., 25000"
  helpText="Annual capacity in metric tonnes"
  step="1"
  min="0"
/>
```

### **Email Input with Validation**
```tsx
<ValidatedInput
  name="email"
  label="Email Address"
  type="email"
  value={formData.email}
  onChange={updateField}
  error={getFieldError('email')}
  isValid={isFieldValid('email')}
  isTouched={isFieldTouched('email')}
  required
  placeholder="email@example.com"
  helpText="We'll use this for notifications"
/>
```

### **URL Input with Auto-Formatting**
```tsx
<ValidatedInput
  name="website"
  label="Website"
  type="url"
  value={formData.website}
  onChange={updateField}
  error={getFieldError('website')}
  isValid={isFieldValid('website')}
  isTouched={isFieldTouched('website')}
  placeholder="example.com"
  helpText="Company or facility website"
  autoFormat="url"
/>
```

### **Dropdown Select with Validation**
```tsx
<ValidatedSelect
  name="status"
  label="Status"
  value={formData.status}
  onChange={updateField}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
  error={getFieldError('status')}
  isValid={isFieldValid('status')}
  isTouched={isFieldTouched('status')}
  required
  placeholder="Select status"
/>
```

### **Textarea with Validation**
```tsx
<ValidatedInput
  name="description"
  label="Description"
  as="textarea"
  rows={4}
  value={formData.description}
  onChange={updateField}
  error={getFieldError('description')}
  isValid={isFieldValid('description')}
  isTouched={isFieldTouched('description')}
  placeholder="Enter detailed description..."
  helpText="Provide as much detail as possible"
/>
```

## **🎯 Result: Professional Forms in Minutes**

With just a few lines of code, you get:
- ✅ **Professional validation** like major websites
- ✅ **Real-time feedback** as users type
- ✅ **Clear error messages** instead of confusing alerts
- ✅ **Smart formatting** for phones, URLs, etc.
- ✅ **Accessible design** with proper labels and ARIA
- ✅ **Mobile-friendly** responsive design
- ✅ **Consistent styling** across all forms

**The form validation system transforms basic HTML forms into professional, user-friendly experiences that guide users to success!**