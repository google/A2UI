# Client-Side Functions

This page documents the standard client-side functions available in the A2UI catalog. These functions can be used for data validation, string formatting, and logical operations within your UI definitions.

## Usage

Functions are invoked using the `FunctionCall` object structure:

```json
{
  "call": "functionName",
  "args": {
    "arg1": "value1",
    "arg2": {"path": "/data/path"}
  }
}
```

## Validation Functions

These functions return a boolean and are primarily used in the `checks` property of input components.

### required
Checks that the value is not null, undefined, or empty.
- **args**:
  - `value`: The value to check.

### regex
Checks that the value matches a regular expression string.
- **args**:
  - `value`: The string to check.
  - `pattern`: The regex pattern to match against.

### length
Checks string length constraints.
- **args**:
  - `value`: The string to check.
  - `min` (optional): Minimum length.
  - `max` (optional): Maximum length.

### numeric
Checks numeric range constraints.
- **args**:
  - `value`: The number to check.
  - `min` (optional): Minimum value.
  - `max` (optional): Maximum value.

### email
Checks that the value is a valid email address.
- **args**:
  - `value`: The string to check.

## Formatting Functions

These functions return a formatted string and are often used in `Text` components or `formatString` calls.

### formatString
Performs string interpolation.
- **args**:
  - `value`: The format string containing `${expression}` placeholders.
- **Usage**: `${formatString(value:'Hello ${/name}')}` or simply as a direct function call.

### formatNumber
Formats a number with grouping and precision.
- **args**:
  - `value`: The number to format.
  - `decimals` (optional): Number of decimal places.
  - `grouping` (optional): Whether to use grouping separators (default: true).

### formatCurrency
Formats a number as a currency string.
- **args**:
  - `value`: The amount.
  - `currency`: ISO 4217 currency code (e.g., 'USD').
  - `decimals` (optional): Number of decimal places.
  - `grouping` (optional): Whether to use grouping separators.

### formatDate
Formats a timestamp using a pattern.
- **args**:
  - `value`: The date/time to format.
  - `format`: Unicode TR35 date pattern (e.g., 'MMM dd, yyyy').

### pluralize
Selects a localized string based on a count.
- **args**:
  - `value`: The count.
  - `other`: Fallback string.
  - `zero`, `one`, `two`, `few`, `many` (optional): Category-specific strings.

## Logical Functions

Used to combine multiple boolean conditions.

### and
Logical AND.
- **args**:
  - `values`: Array of boolean values.

### or
Logical OR.
- **args**:
  - `values`: Array of boolean values.

### not
Logical NOT.
- **args**:
  - `value`: Boolean value to negate.

## Utility Functions

### openUrl
Opens a URL in a browser or handler.
- **args**:
  - `url`: The URL to open.
