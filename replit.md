# AetherMind - Academic Research Platform

## Overview

AetherMind is a comprehensive AI-powered academic research and collaboration platform designed to streamline the research process for students, academics, and research teams. The platform combines document management, AI-assisted analysis, citation generation, literature discovery, and team collaboration features in a modern web application.

The system serves as a centralized workspace for academic projects, offering tools for file management, task tracking, team collaboration, and AI-powered research assistance including citation generation, literature search, outline building, and data analysis capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **State Management**: React Query (TanStack Query) for server state management and caching
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **Theme System**: CSS custom properties with light/dark mode support

### Backend Architecture
- **Runtime**: Node.js with TypeScript and ES modules
- **Framework**: Express.js for HTTP server and API routes
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and JWT tokens for session management
- **File Processing**: Multer for handling file uploads with memory storage
- **Real-time Communication**: WebSocket server for live notifications and collaboration features

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Design**: Comprehensive relational schema supporting users, projects, files, tasks, conversations, messages, document versions, and notifications
- **Cloud Storage**: Backblaze B2 for scalable file storage with S3-compatible API
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple

### Authentication and Authorization
- **Authentication Strategy**: JWT-based authentication with 24-hour token expiration
- **Password Security**: Scrypt-based password hashing with salt for secure storage
- **Session Management**: Express sessions with secure cookie configuration
- **Authorization Model**: Role-based access control with Owner/Editor/Viewer permissions for project collaboration

## External Dependencies

### AI and Machine Learning Services
- **Primary AI Provider**: Grok 4 Fast via OpenRouter API for text analysis, writing assistance, and research tasks
- **AI Capabilities**: Grammar checking, paraphrasing, summarization, citation extraction, literature suggestions, and outline generation

### Academic and Research APIs
- **CrossRef API**: Academic paper metadata and citation information retrieval
- **arXiv API**: Access to preprint research papers and academic content
- **DOI Resolution**: Automatic citation information extraction from DOI identifiers

### Cloud Infrastructure
- **File Storage**: Backblaze B2 cloud storage for document hosting and management
- **Database Hosting**: Neon PostgreSQL for scalable database operations
- **CDN and Assets**: Direct file serving through signed URLs for secure access

### Development and Build Tools
- **Package Management**: npm for dependency management
- **Type Checking**: TypeScript compiler for static type validation
- **Database Migrations**: Drizzle Kit for schema migrations and database management
- **Development Server**: Vite development server with hot module replacement

### UI and Design Libraries
- **Component Library**: Radix UI primitives for accessible component foundations
- **Icon System**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Styling Framework**: Tailwind CSS for utility-first styling approach