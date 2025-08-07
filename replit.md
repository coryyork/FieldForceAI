# Field Force 2 - AI-Powered Business Platform

## Overview

Field Force 2 is a comprehensive multi-tenant SaaS business management platform that combines CRM functionality with AI-powered search capabilities. The application provides a centralized hub for managing leads, organizing knowledge bases, and extracting insights from business data through natural language queries. Built as a full-stack web application, it features a modern React frontend with a Node.js Express backend, designed for multi-tenant use with company-based data isolation and dynamic organization branding.

## Recent Changes (August 2025)

- **Voice Conversations**: Integrated OpenAI Realtime API for life-like AI voice interactions
- **AI Settings Page**: Customizable AI assistant with name, personality, response style, and voice selection
- **Voice Options**: Support for all 6 OpenAI voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- **Voice Controls**: Adjustable voice speed, mute/unmute, and WebSocket-based real-time communication
- **Navigation Restructure**: Knowledge Base now appears as submenu under AI Assistant
- **Multi-tenant Architecture**: Complete company workspace system with automatic onboarding flow
- **Dynamic Branding**: Header displays "My [Organization Name]" based on user's company
- **Company Onboarding**: New users automatically guided through organization setup process

## User Preferences

- **Communication style**: Simple, everyday language
- **Navigation**: "Sales" instead of "CRM & Leads", separate "Tasks & Notes" page
- **Branding**: Dynamic organization name display ("My [Organization Name]")
- **Architecture**: Multi-tenant SaaS with company workspaces

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing without the complexity of React Router
- **State Management**: TanStack Query (React Query) for server state management, providing caching, synchronization, and background updates
- **UI Components**: Radix UI primitives with custom styling through shadcn/ui components for accessibility and consistency
- **Styling**: Tailwind CSS with CSS variables for theming, supporting both light and dark modes
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript with ES modules for modern JavaScript features and type safety
- **Authentication**: Replit Auth integration using OpenID Connect for seamless user management
- **Session Management**: Express sessions with PostgreSQL storage for persistent user sessions
- **API Structure**: RESTful design with dedicated routes for CRM, documents, tasks, and AI services

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting for scalability and performance
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Multi-tenant architecture with company-based data isolation
- **Migration Management**: Drizzle Kit for database schema migrations and version control

### Core Data Models
- **Users**: Authentication and profile management with company association
- **Companies**: Multi-tenant isolation with domain-based organization
- **Leads**: CRM functionality with stage tracking and value management
- **Documents**: Knowledge base with content search and tagging capabilities
- **Tasks**: Project management with priority and status tracking
- **Activities**: Audit trail for business actions and user interactions

### Authentication and Authorization
- **Provider**: Replit Auth with OpenID Connect protocol for secure authentication
- **Session Strategy**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Authorization Pattern**: Role-based access control (user, admin, owner) with company-scoped permissions
- **Security**: HTTP-only cookies with secure flags for production environments

### AI Integration
- **Provider**: OpenAI GPT-4o for natural language processing and business intelligence
- **Voice Conversations**: OpenAI Realtime API for voice input/output with selectable voices
- **Functionality**: Unified search across CRM data, documents, and tasks with contextual analysis
- **Architecture**: Dedicated AI service layer that aggregates data from multiple sources before AI processing
- **WebSocket Integration**: Real-time bidirectional communication for voice conversations
- **Voice Features**: 6 voice options, adjustable speed (0.25x-4x), mute controls, visual feedback
- **Response Format**: Structured JSON responses with summaries, ranked results, and actionable insights

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling and automated scaling
- **OpenAI API**: GPT-4o model for AI-powered search and business intelligence features
- **Replit Auth**: Authentication service providing OpenID Connect integration

### Development Tools
- **Vite**: Fast build tool and development server with hot module replacement
- **ESBuild**: Production bundling for optimized server-side code
- **Drizzle Kit**: Database schema management and migration tooling

### UI and Styling
- **Radix UI**: Unstyled, accessible component primitives for complex UI patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Consistent icon library with tree-shaking support

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for runtime type checking
- **Hookform Resolvers**: Integration between React Hook Form and Zod validation

### Development Environment
- **TypeScript**: Static type checking across frontend, backend, and shared code
- **PostCSS**: CSS processing with Tailwind and Autoprefixer plugins
- **Replit Integration**: Development environment with runtime error handling and cartographer plugins