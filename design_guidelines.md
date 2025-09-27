# OMNISCI AI Design Guidelines

## Design Approach: Reference-Based (Productivity Tools)
Drawing inspiration from modern productivity platforms like Notion, Linear, and Asana, emphasizing clean interfaces that prioritize functionality while maintaining visual appeal for academic users.

## Core Design Elements

### Color Palette
**Dark Mode Primary:**
- Background: 220 15% 8% (deep charcoal)
- Surface: 220 12% 12% (elevated surfaces)
- Primary: 220 90% 65% (intelligent blue)
- Text Primary: 220 10% 95% (near white)
- Text Secondary: 220 8% 70% (muted text)
- Border: 220 10% 20% (subtle borders)
- Success: 142 76% 56% (emerald green)
- Warning: 38 92% 60% (amber)
- Error: 0 84% 65% (red)

**Light Mode:**
- Background: 220 15% 98%
- Surface: 0 0% 100%
- Primary: 220 90% 55%
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 45%

### Typography
- **Primary**: Inter (Google Fonts) - Clean, readable for UI text
- **Secondary**: JetBrains Mono (Google Fonts) - Code and technical content
- **Headings**: 600-700 weight, sizes from text-lg to text-3xl
- **Body**: 400-500 weight, text-sm to text-base
- **Code/Technical**: 400 weight, text-xs to text-sm

### Layout System
Using Tailwind spacing units: **2, 4, 6, 8, 12, 16** for consistent rhythm
- Tight spacing: p-2, m-2 (8px)
- Standard: p-4, m-4 (16px) 
- Generous: p-6, m-6 (24px)
- Large: p-8, m-8 (32px)
- Section: p-12, m-12 (48px)
- Page: p-16, m-16 (64px)

### Component Library

**Navigation:**
- Fixed sidebar with project/workspace switcher
- Top navigation bar with user menu and notifications
- Breadcrumb navigation for deep navigation paths

**Core UI Elements:**
- Cards with subtle shadows and rounded corners (rounded-lg)
- Buttons with primary/secondary/outline variants
- Form inputs with focus states and validation
- File upload zones with drag-and-drop styling
- Progress indicators for file processing and AI tasks

**Data Displays:**
- Clean tables with alternating row colors
- File preview cards with thumbnails and metadata
- Task cards with status indicators and priority levels
- Chat bubbles with user/AI distinction

**Specialized Components:**
- Rich text editor with formatting toolbar
- AI chat interface with typing indicators
- File browser with grid/list view toggle
- Project dashboard with metrics cards
- Version history timeline

**Overlays:**
- Modal dialogs for file actions and confirmations
- Dropdown menus with proper positioning
- Tooltips for feature explanations
- Loading states with skeleton screens

### Academic-Focused Features
- Citation format selector (APA, MLA, Chicago)
- Document outline viewer for long texts
- Research progress tracking visualizations
- Collaborative annotation tools
- Reference management interface

### Animations
Minimal and purposeful:
- Smooth transitions for state changes (200-300ms)
- Subtle hover effects on interactive elements
- Loading animations for AI processing
- Page transitions using fade effects

## Images
No large hero images needed. Focus on:
- User avatars (32px, 40px, 48px sizes)
- File type icons from established icon libraries
- AI processing indicators (animated dots/progress)
- Empty state illustrations (simple, academic-themed)

This design prioritizes functionality and collaboration while maintaining the professional aesthetic expected by academic users.