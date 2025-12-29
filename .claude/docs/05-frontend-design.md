# Frontend Design

## Design System

### Colors (Dark Theme Default)

```css
:root {
  /* Background */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;

  /* Card */
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;

  /* Primary (Blue) */
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;

  /* Secondary */
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  /* Success (Green) */
  --success: 142.1 76.2% 36.3%;
  --success-foreground: 355.7 100% 97.3%;

  /* Destructive (Red) */
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  /* Warning (Yellow) */
  --warning: 47.9 95.8% 53.1%;
  --warning-foreground: 26 83.3% 14.1%;

  /* Muted */
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  /* Border */
  --border: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

### Typography

```css
/* Font Stack */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;

/* Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### Spacing

```css
/* Spacing Scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

---

## Component Library (shadcn/ui)

### Core Components Used

| Component | Usage |
|-----------|-------|
| `Button` | Primary actions, navigation |
| `Card` | Question cards, stat cards |
| `Badge` | Tags, section labels, confidence |
| `Progress` | Quiz progress, import progress |
| `Dialog` | Confirmations, modals |
| `DropdownMenu` | Settings, filters |
| `Tabs` | Mode switching |
| `Input` | Form fields |
| `Textarea` | Notes, descriptions |
| `Select` | Filters, dropdowns |
| `Checkbox` | Multi-select options |
| `RadioGroup` | Single-select options |
| `Toast` | Notifications |
| `Skeleton` | Loading states |

---

## Page Layouts

### Main Layout
```
┌────────────────────────────────────────────────────┐
│ Header                                    [Theme]  │
├─────────────────┬──────────────────────────────────┤
│                 │                                  │
│    Sidebar      │         Main Content             │
│                 │                                  │
│   • Dashboard   │                                  │
│   • Exams       │                                  │
│   • Admin       │                                  │
│   • Settings    │                                  │
│                 │                                  │
│                 │                                  │
│                 │                                  │
└─────────────────┴──────────────────────────────────┘
```

### Study Layout (Full-width)
```
┌────────────────────────────────────────────────────┐
│ Exam: GCP Security          Q42/346    [Exit]      │
├────────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│                 Question Content                   │
│                                                    │
│                                                    │
├────────────────────────────────────────────────────┤
│ [← Prev]                              [Next →]     │
└────────────────────────────────────────────────────┘
```

---

## Key Components

### QuestionCard

```tsx
interface QuestionCardProps {
  question: Question;
  mode: 'quiz' | 'review' | 'view';
  selectedOptions: string[];
  onSelect: (option: string) => void;
  showAnswer: boolean;
  onSubmit?: () => void;
}
```

```
┌─────────────────────────────────────────────────────┐
│ ┌───────┐ ┌───────────────┐ ┌────────┐              │
│ │ Q42   │ │ Section 2.3   │ │ High   │              │
│ └───────┘ └───────────────┘ └────────┘              │
│                                                     │
│ Your company wants to restrict access to Cloud      │
│ Storage buckets from only your on-premises          │
│ network. Which solution should you implement?       │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ○ A. Use VPC Service Controls with an access    │ │
│ │      level for your on-premises IP range        │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ● B. Configure bucket IAM policies with IP      │ │
│ │      conditions                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ○ C. Use Cloud NAT with the bucket in a         │ │
│ │      private subnet                             │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ○ D. Configure Private Google Access on your    │ │
│ │      VPC                                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│                              ┌──────────────────┐   │
│                              │     Submit       │   │
│                              └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### OptionButton

```tsx
interface OptionButtonProps {
  label: string;        // "A", "B", etc.
  text: string;         // Option text
  selected: boolean;
  correct?: boolean;    // Only when showing answer
  showResult: boolean;
  onClick: () => void;
  disabled: boolean;
}
```

States:
- Default: Gray border
- Hover: Blue border
- Selected: Blue background
- Correct (revealed): Green background
- Wrong (revealed): Red background

### ExplanationPanel

```
┌─────────────────────────────────────────────────────┐
│ ✓ Correct Answer: A                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Explanation                                         │
│ ───────────                                         │
│ VPC Service Controls create a security perimeter    │
│ around Google Cloud resources. By defining an       │
│ access level that allows only your on-premises IP   │
│ range, you can restrict access to Cloud Storage     │
│ buckets from only your corporate network.           │
│                                                     │
│ Why B is wrong                                      │
│ ───────────────                                     │
│ Bucket IAM policies do not support IP-based         │
│ conditions directly. You need VPC Service Controls  │
│ for network-level restrictions.                     │
│                                                     │
│ References                                          │
│ ──────────                                          │
│ • VPC Service Controls documentation                │
│ • Access levels configuration                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### StatsCard

```
┌───────────────────┐
│ 📊 Accuracy       │
│                   │
│      65%          │
│                   │
│ ↑ 5% from last    │
│   week            │
└───────────────────┘
```

### ImportDropzone

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│           ┌─────────────────────────┐               │
│           │                         │               │
│           │     📁                  │               │
│           │                         │               │
│           │  Drop ZIP file here     │               │
│           │                         │               │
│           │  or click to browse     │               │
│           │                         │               │
│           └─────────────────────────┘               │
│                                                     │
│  Accepted: .zip containing .md or .json files       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Mobile Adaptations

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Sidebar | Fixed left | Bottom nav / hamburger |
| Quiz options | Horizontal padding | Full width |
| Stats grid | 4 columns | 2 columns |
| Explanation | Side panel | Bottom sheet |

---

## Animation & Transitions

```css
/* Default transition */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Page transitions */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Option selection */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Correct answer */
@keyframes success {
  0% { background-color: transparent; }
  100% { background-color: var(--success); }
}
```

---

## Charts (Recharts)

### Accuracy Trend
```tsx
<AreaChart data={accuracyData}>
  <XAxis dataKey="date" />
  <YAxis domain={[0, 100]} />
  <Area
    type="monotone"
    dataKey="accuracy"
    stroke="var(--primary)"
    fill="var(--primary)"
    fillOpacity={0.2}
  />
</AreaChart>
```

### Section Breakdown
```tsx
<BarChart data={sectionData} layout="vertical">
  <XAxis type="number" domain={[0, 100]} />
  <YAxis type="category" dataKey="section" />
  <Bar dataKey="accuracy" fill="var(--primary)">
    {sectionData.map((entry, index) => (
      <Cell
        key={index}
        fill={entry.accuracy < 60 ? 'var(--destructive)' : 'var(--primary)'}
      />
    ))}
  </Bar>
</BarChart>
```

---

## Loading States

### Skeleton Loading
```tsx
// Question loading
<Card>
  <Skeleton className="h-4 w-20" /> {/* Badge */}
  <Skeleton className="h-24 w-full" /> {/* Question */}
  <Skeleton className="h-12 w-full" /> {/* Option */}
  <Skeleton className="h-12 w-full" /> {/* Option */}
</Card>
```

### Import Progress
```tsx
<div className="space-y-4">
  <Progress value={progress} />
  <p>{processed} / {total} questions</p>
</div>
```

---

## Error States

### Empty State
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                      📚                             │
│                                                     │
│              No exams yet                           │
│                                                     │
│     Create your first exam to get started           │
│                                                     │
│              ┌──────────────────┐                   │
│              │   Create Exam    │                   │
│              └──────────────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                      ⚠️                              │
│                                                     │
│           Failed to load questions                  │
│                                                     │
│     There was an error connecting to the database   │
│                                                     │
│              ┌──────────────────┐                   │
│              │      Retry       │                   │
│              └──────────────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Accessibility

- All interactive elements keyboard accessible
- Focus indicators visible
- Color contrast meets WCAG 2.1 AA
- Screen reader announcements for feedback
- Reduced motion support
- Proper heading hierarchy
