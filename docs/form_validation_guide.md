# 📝 Form Validation Guide

This guide shows how to use the new form validation system implemented in the Lithium Battery Recycling Dashboard.

## 🎯 **What's New?**

### ✅ **Real-Time Validation**
- Fields validate **as you type**
- **Visual feedback** with red/green borders
- **Clear error messages** below each field
- **Smart formatting** for phones, URLs, coordinates

### ✅ **Professional Form Components**
- **ValidatedInput** - Text, number, email, URL inputs with validation
- **ValidatedSelect** - Dropdown selects with validation
- **FormSection** - Organized, collapsible form sections
- **FormValidationSummary** - Shows all errors at once

### ✅ **Smart Error Handling**
- **Submit button disabled** until form is valid
- **Toast notifications** for success/error feedback
- **Helpful hints** and examples for each field
- **Required field indicators** with red asterisks

## 🖼️ **Visual Examples**

### **Invalid Field (Red Border)**
```
┌─────────────────────────────────┐
│ Company Name *                  │
│ ┌─────────────────────────────┐ │ 
│ │                           │ │ ← Empty required field
│ └─────────────────────────────┘ │
│ ❌ Company name is required     │ ← Clear error message
│ ℹ️ The company that owns this facility │ ← Helpful hint
└─────────────────────────────────┘
```

### **Valid Field (Green Border)**
```
┌─────────────────────────────────┐
│ Company Name *                  │
│ ┌─────────────────────────────┐ │ 
│ │ Tesla Motors              │ │ ← Properly filled
│ └─────────────────────────────┘ │
│ ✅ Looks good!                  │ ← Success feedback
└─────────────────────────────────┘
```

### **Smart Formatting**
```
User types: "5551234567"
Auto-formats to: "(555) 123-4567"

User types: "example.com"
Auto-formats to: "https://example.com"

User types: "40.123456789"
Auto-formats to: "40.123457" (6 decimals for coordinates)
```

## 🔧 **How to Use**

### **1. In Your Components**

```tsx
import { useFormValidation } from '../hooks/useFormValidation';
import { ValidatedInput, ValidatedSelect } from '../components/forms';
import { facilityValidationSchema } from '../utils/facilityValidation';

const MyForm = () => {
  const {
    formData,
    updateField,
    getFieldError,
    isFieldValid,
    isFieldTouched,
    isValid
  } = useFormValidation({
    validationSchema: facilityValidationSchema,
    initialData: { company_name: '', email: '' }
  });

  return (
    <form>
      <ValidatedInput
        name="company_name"
        label="Company Name"
        value={formData.company_name}
        onChange={(name, value) => updateField(name, value)}
        error={getFieldError('company_name')}
        isValid={isFieldValid('company_name')}
        isTouched={isFieldTouched('company_name')}
        required
      />
      
      <button disabled={!isValid}>Submit</button>
    </form>
  );
};
```

### **2. Available Validation Rules**

```tsx
import { validationRules } from '../utils/validation';

// Common rules
validationRules.required('This field is required')
validationRules.email('Please enter a valid email')
validationRules.url('Please enter a valid URL')
validationRules.number('Please enter a valid number')
validationRules.positiveNumber('Must be positive')
validationRules.minLength(5, 'Must be at least 5 characters')
validationRules.maxLength(100, 'Must be less than 100 characters')

// Specialized rules
validationRules.latitude() // -90 to 90
validationRules.longitude() // -180 to 180
validationRules.phone() // US phone number format
validationRules.range(0, 100, 'Must be between 0 and 100')

// Custom rules
validationRules.custom(
  (value) => value !== 'forbidden',
  'This value is not allowed'
)
```

### **3. Creating Validation Schemas**

```tsx
const myValidationSchema = {
  'company_name': [
    validationRules.required(),
    validationRules.minLength(2),
    validationRules.maxLength(100)
  ],
  'email': [
    validationRules.required(),
    validationRules.email()
  ],
  'details.website': [
    validationRules.url()
  ],
  'latitude': [
    validationRules.latitude()
  ]
};
```

## 🎨 **Form Sections & Organization**

### **Collapsible Sections**
```tsx
<FormSection
  title="Basic Information"
  description="Core facility details"
  icon="fas fa-info-circle"
  collapsible={true}
  initiallyExpanded={true}
>
  {/* Your form fields here */}
</FormSection>
```

### **Validation Summary**
```tsx
<FormValidationSummary 
  errors={['Company name is required', 'Invalid email address']}
  isVisible={errors.length > 0}
/>
```

## 🚀 **Real-World Example: Facility Creation**

The **Create New Facility** page (`/facilities/new`) now includes:

### **✅ Required Field Validation**
- **Company Name** - Required, 2-100 characters
- **Operational Status** - Must select from dropdown

### **✅ Format Validation**
- **Website** - Must be valid URL (auto-adds https://)
- **Coordinates** - Latitude (-90 to 90), Longitude (-180 to 180)
- **Capacity** - Must be positive number
- **Jobs/EV Equivalent** - Must be whole numbers

### **✅ Smart UX Features**
- **Submit disabled** until all required fields valid
- **Real-time validation** as you type
- **Helpful examples** in placeholder text
- **Success toast** when facility created
- **Error toast** if creation fails

## 📱 **Mobile-Friendly**

- **Touch-friendly** input sizes (16px font to prevent zoom)
- **Responsive layout** that stacks on mobile
- **Easy-to-read** error messages
- **Proper keyboard types** (number, email, url)

## 🔍 **Examples You Can Test**

### **Try These Invalid Inputs:**
1. **Company Name**: Leave empty → "Company name is required"
2. **Latitude**: Enter "999" → "Latitude must be between -90 and 90"  
3. **Website**: Enter "not-a-url" → "Please enter a valid URL"
4. **Capacity**: Enter "abc" → "Please enter a valid number"

### **Try These Valid Inputs:**
1. **Company Name**: "Tesla Motors" → Green checkmark
2. **Latitude**: "40.7128" → Formats to "40.712800"
3. **Website**: "tesla.com" → Auto-formats to "https://tesla.com"
4. **Phone**: "5551234567" → Formats to "(555) 123-4567"

## 🎯 **Benefits for Users**

- ✅ **Know exactly what's wrong** before submitting
- ✅ **Get helpful guidance** on expected formats  
- ✅ **Confidence that data is valid** before saving
- ✅ **Professional, polished experience**
- ✅ **No more confusing error messages**

## 🛠️ **Benefits for Developers**

- ✅ **Reusable validation components**
- ✅ **Centralized validation logic**
- ✅ **Type-safe form handling**
- ✅ **Easy to extend and customize**
- ✅ **Consistent UX across all forms**

---

**Ready to try it?** Visit `/facilities/new` and see the validation system in action!