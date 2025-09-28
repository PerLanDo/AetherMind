# 🎓 ScholarSync

**AI-Powered Academic Research & Collaboration Platform**

ScholarSync is a comprehensive academic research platform that combines intelligent AI tools, team collaboration, and document management to streamline the entire research lifecycle for students, researchers, and professors.

---

## 🌟 **Key Features**

### **🤖 AI Research Assistant**
- **Citation Generator**: Professional citations in APA, MLA, Chicago, Harvard, and IEEE formats
- **Literature Discovery**: Search 100M+ academic papers via CrossRef and arXiv
- **Writing Assistant**: Grammar checking, style improvement, and academic writing enhancement
- **Document Analysis**: AI-powered analysis for summaries, key points, methodology, and references
- **Outline Builder**: Structured academic writing with AI-generated outlines
- **Data Analysis**: Statistical analysis and code generation (Python, R, Excel)

### **👥 Team Collaboration**
- **Multi-User Workspaces**: Project-based collaboration with role-based access
- **Role-Based Permissions**: Owner, Editor, and Viewer roles with appropriate access levels
- **Real-Time Notifications**: WebSocket-powered live updates for team activities
- **Task Management**: Kanban board with assignments, deadlines, and progress tracking
- **Team Chat**: Collaborative AI-assisted discussions

### **📁 Document Management**
- **Cloud Storage**: Secure file storage with Backblaze B2 integration
- **File Organization**: Project-based file management with search and filtering
- **Version Control**: Document versioning with rollback capabilities
- **Secure Access**: Time-limited signed URLs for file downloads

---

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Routing**: wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with dark/light theme support

### **Backend Stack**
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT + Session-based hybrid authentication
- **Real-time**: WebSocket notifications
- **File Storage**: Backblaze B2 cloud storage (S3-compatible)

### **AI Integration**
- **Provider**: OpenAI via OpenRouter
- **Model**: Grok 4 Fast for optimal performance
- **Services**: Modular AI services for different use cases
- **APIs**: CrossRef for academic papers, arXiv for preprints

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL database
- Backblaze B2 account
- Grok 4 Fast API key (via OpenRouter)

### **Installation**

1. **Clone and Install**
```bash
git clone <your-repo-url>
cd ScholarSync
npm install
```

2. **Environment Setup**
```bash
# Copy environment template
cp vercel-env-template.md .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Push database schema
npm run db:push
```

4. **Development**
```bash
# Start development server
npm run dev
```

5. **Production Build**
```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🌐 **Deployment**

### **Vercel (Recommended)**

1. **Prepare for Vercel**
```bash
npm install -g vercel
npm run build:client
```

2. **Deploy**
```bash
vercel --prod
```

3. **Configure Environment Variables**
Set these in your Vercel dashboard:
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secure-secret
GROK_4_FAST_FREE_API_KEY=your-api-key
B2_ACCESS_KEY_ID=your-b2-key
B2_SECRET_ACCESS_KEY=your-b2-secret
B2_BUCKET_NAME=SCHOLARSYNC
NODE_ENV=production
```

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
```

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions.

---

## 📖 **API Documentation**

### **Authentication**
```typescript
POST /api/register    // User registration
POST /api/login       // User login
POST /api/logout      // User logout
GET  /api/user        // Current user info
```

### **Projects**
```typescript
GET    /api/projects                      // User's projects with roles
POST   /api/projects                      // Create project
DELETE /api/projects/:id                  // Delete project
GET    /api/projects/:id/members          // Project members
POST   /api/projects/:id/members          // Add member
PUT    /api/projects/:id/members/:userId/role  // Update role
DELETE /api/projects/:id/members/:userId  // Remove member
```

### **Files**
```typescript
GET  /api/projects/:id/files              // Project files
POST /api/files/:id/analyze               // AI document analysis
```

### **Tasks**
```typescript
GET  /api/projects/:id/tasks              // Project tasks
POST /api/projects/:id/tasks              // Create task
PUT  /api/tasks/:id/status               // Update task status
```

### **AI Services**
```typescript
POST /api/ai/analyze                      // General AI analysis
POST /api/citation/*                      // Citation generation
POST /api/literature/*                    // Literature search
POST /api/outline/*                       // Outline generation
POST /api/analysis/*                      // Data analysis
```

---

## 🎯 **Core Concepts**

### **Project-Centric Workflow**
- Everything in ScholarSync is organized around **Projects**
- Each project has files, tasks, team members, and conversations
- Role-based access ensures proper permissions

### **Document-First Approach**
- **Files page is the home page** - emphasizing document management
- AI tools are contextually available from uploaded documents
- Analysis and writing assistance are tightly integrated with file workflows

### **AI-Enhanced Experience**
- AI tools are categorized and searchable
- Context-aware suggestions based on uploaded documents
- Integrated writing assistance throughout the platform

---

## 🔧 **Development Guide**

### **Project Structure**
```
ScholarSync/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── lib/            # Utilities and configurations
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express backend
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database access layer
│   ├── ai-service.ts       # AI integration
│   └── *.ts               # Service modules
├── shared/                 # Shared types and schemas
└── migrations/            # Database migrations
```

### **Key Conventions**

#### **React Query Keys**
Always use array format starting with `"api"`:
```typescript
// ✅ Correct
queryKey: ["api", "projects"]
queryKey: ["api", "files", projectId]

// ❌ Wrong
queryKey: ["/api/projects"]  // Creates malformed URLs
```

#### **Component Props**
- All modal components should have `onClose` prop
- Use consistent prop naming across similar components
- Pass initial state via props when needed

#### **Routing**
- Use query parameters for state: `?create=true`, `?project=123`
- Clean URLs after processing query parameters
- Maintain backward compatibility with alternative routes

### **Adding New Features**

1. **Backend**: Add route in `server/routes.ts`
2. **Database**: Update schema in `shared/schema.ts`
3. **Frontend**: Create component in `client/src/components/`
4. **Integration**: Add to appropriate page or navigation

---

## 🔐 **Security**

### **Authentication Flow**
1. User logs in via `/api/login`
2. Server sets session cookie + returns JWT token
3. Client stores JWT in localStorage as `authToken`
4. API requests include both `Authorization: Bearer <token>` and `credentials: "include"`

### **Authorization**
- Role-based access control (RBAC) enforced at database level
- All file/project access verified through `storage.ts` methods
- Signed URLs for secure file downloads

### **Data Protection**
- SQL injection prevention via Drizzle ORM
- Input validation on all endpoints
- Rate limiting on API endpoints
- Secure headers via Helmet middleware

---

## 📊 **Performance**

### **Frontend Optimizations**
- Code splitting with vendor and UI chunks
- React Query caching reduces redundant API calls
- Lazy loading for large components
- Optimized bundle sizes with Vite

### **Backend Optimizations**
- Efficient database queries with proper joins
- Connection pooling for database
- Signed URLs reduce server bandwidth for file downloads
- Caching strategies for frequently accessed data

---

## 🧪 **Testing**

### **Manual Testing Checklist**
- [ ] User registration and login
- [ ] Project creation and management
- [ ] File upload and download
- [ ] AI tools functionality
- [ ] Team collaboration features
- [ ] Task management
- [ ] Real-time notifications

### **API Testing**
```bash
# Health check
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Build Errors**
```bash
# Check TypeScript compilation
npm run check

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **Database Connection**
- Ensure DATABASE_URL includes `?sslmode=require` for cloud databases
- Verify database is accessible from your deployment environment
- Check that all required tables exist (`npm run db:push`)

#### **File Upload Issues**
- Verify Backblaze B2 credentials are correct
- Check bucket permissions and CORS settings
- Ensure `cloudKey` column exists in files table

#### **Authentication Problems**
- Verify SESSION_SECRET and JWT_SECRET are set
- Check that cookies are being set properly
- Ensure CORS is configured for your domain

---

## 📈 **Monitoring & Analytics**

### **Health Monitoring**
- `/api/health` endpoint provides system status
- Monitor response times and error rates
- Track database connection health

### **User Analytics**
- Monitor feature usage patterns
- Track user engagement metrics
- Analyze collaboration patterns

---

## 🤝 **Contributing**

### **Code Style**
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Consistent naming conventions
- Comprehensive error handling

### **Pull Request Process**
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit PR with detailed description

---

## 📄 **License**

MIT License - see LICENSE file for details.

---

## 🆘 **Support**

### **Documentation**
- [Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Phase 2 Roadmap](./PHASE_2_ROADMAP.md)
- [Technical Inspection Report](./APP_INSPECTION_REPORT.md)

### **Community**
- GitHub Issues for bug reports
- Discussions for feature requests
- Documentation improvements welcome

---

**🎉 ScholarSync - Empowering Academic Research Through AI** 🎉
