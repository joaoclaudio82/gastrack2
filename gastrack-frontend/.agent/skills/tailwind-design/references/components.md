# Component Patterns Reference

## Buttons

### Primary Button

```html
<button
  class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
>
  Button Text
</button>
```

### Secondary Button

```html
<button
  class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-colors duration-200"
>
  Button Text
</button>
```

### Outline Button

```html
<button
  class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors duration-200"
>
  Button Text
</button>
```

### Danger Button

```html
<button
  class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors duration-200"
>
  Delete
</button>
```

### Icon Button

```html
<button
  class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
>
  <svg class="w-5 h-5">...</svg>
</button>
```

---

## Inputs

### Text Input

```html
<input
  type="text"
  class="w-full px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
  placeholder="Enter text..."
/>
```

### Input with Label

```html
<div class="space-y-1">
  <label class="block text-sm font-medium text-gray-700">
    Label
    <span class="text-red-500">*</span>
  </label>
  <input
    type="text"
    class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
  />
</div>
```

### Input with Error

```html
<div class="space-y-1">
  <label class="block text-sm font-medium text-gray-700">Email</label>
  <input
    type="email"
    class="w-full px-4 py-2.5 text-sm text-red-900 placeholder:text-red-300 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
  />
  <p class="text-sm text-red-600">Please enter a valid email</p>
</div>
```

### Select

```html
<select
  class="w-full px-4 py-2.5 pr-10 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
>
  <option value="">Select option</option>
  <option value="1">Option 1</option>
</select>
```

---

## Cards

### Basic Card

```html
<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">Content here</div>
```

### Hoverable Card

```html
<div
  class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
>
  Content here
</div>
```

### Card with Header

```html
<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
    <h3 class="font-semibold text-gray-900">Card Title</h3>
  </div>
  <div class="p-4">Card body content</div>
</div>
```

---

## Badges

### Status Badge

```html
<span
  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
>
  Active
</span>
```

### Badge with Dot

```html
<span
  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
>
  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
  Status
</span>
```

---

## Tables

### Basic Table

```html
<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Column
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Cell content</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Alerts

### Error Alert

```html
<div
  class="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3"
>
  <svg class="w-5 h-5 flex-shrink-0 mt-0.5">...</svg>
  <span>Error message here</span>
</div>
```

### Success Alert

```html
<div
  class="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3"
>
  <svg class="w-5 h-5 flex-shrink-0 mt-0.5">...</svg>
  <span>Success message here</span>
</div>
```

---

## Layout

### Page Container

```html
<div class="container mx-auto px-4 py-6">Content</div>
```

### Card Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="bg-white rounded-xl shadow-sm border p-4">Card 1</div>
  <div class="bg-white rounded-xl shadow-sm border p-4">Card 2</div>
  <div class="bg-white rounded-xl shadow-sm border p-4">Card 3</div>
</div>
```

### Page Header

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Page Title</h1>
    <p class="text-gray-600 mt-1">Page description</p>
  </div>
  <button class="...">Action</button>
</div>
```
