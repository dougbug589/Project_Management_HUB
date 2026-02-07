import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Password hash function using bcrypt (same as in auth)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log("🌱 Starting seed...")

  // Clean up existing data
  console.log("🧹 Cleaning up existing data...")
  await prisma.activityLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.timesheet.deleteMany()
  await prisma.subTask.deleteMany()
  await prisma.taskDependency.deleteMany()
  await prisma.taskAssignee.deleteMany()
  await prisma.task.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.phase.deleteMany()
  await prisma.documentVersion.deleteMany()
  await prisma.document.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.projectTemplate.deleteMany()
  await prisma.reportExport.deleteMany()
  await prisma.organizationMember.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  // Create Users
  console.log("👤 Creating users...")
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password: await hashPassword("password123"),
      name: "Admin User",
      role: "SUPER_ADMIN",
    },
  })

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@test.com",
      password: await hashPassword("password123"),
      name: "Project Manager",
      role: "PROJECT_MANAGER",
    },
  })

  const leadUser = await prisma.user.create({
    data: {
      email: "lead@test.com",
      password: await hashPassword("password123"),
      name: "Team Lead",
      role: "TEAM_LEAD",
    },
  })

  const memberUser = await prisma.user.create({
    data: {
      email: "member@test.com",
      password: await hashPassword("password123"),
      name: "Team Member",
      role: "TEAM_MEMBER",
    },
  })

  const clientUser = await prisma.user.create({
    data: {
      email: "client@test.com",
      password: await hashPassword("password123"),
      name: "Client User",
      role: "CLIENT",
    },
  })

  const projectAdminUser = await prisma.user.create({
    data: {
      email: "projadmin@test.com",
      password: await hashPassword("password123"),
      name: "Project Admin",
      role: "PROJECT_ADMIN",
    },
  })

  const developer1 = await prisma.user.create({
    data: {
      email: "dev1@test.com",
      password: await hashPassword("password123"),
      name: "Alex Morgan",
      role: "TEAM_MEMBER",
    },
  })

  const developer2 = await prisma.user.create({
    data: {
      email: "dev2@test.com",
      password: await hashPassword("password123"),
      name: "Michael Chen",
      role: "TEAM_MEMBER",
    },
  })

  const designer = await prisma.user.create({
    data: {
      email: "designer@test.com",
      password: await hashPassword("password123"),
      name: "Emma Davis",
      role: "TEAM_MEMBER",
    },
  })

  const qaEngineer = await prisma.user.create({
    data: {
      email: "qa@test.com",
      password: await hashPassword("password123"),
      name: "David Martinez",
      role: "TEAM_MEMBER",
    },
  })

  // Create Organization
  console.log("🏢 Creating organization...")
  const org = await prisma.organization.create({
    data: {
      name: "Acme Corporation",
      description: "A leading software development company",
      billingEmail: "billing@acme.com",
      ownerId: adminUser.id,
      memberships: {
        create: [
          { userId: adminUser.id, role: "SUPER_ADMIN", status: "ACCEPTED" },
          { userId: managerUser.id, role: "PROJECT_ADMIN", status: "ACCEPTED" },
          { userId: leadUser.id, role: "TEAM_LEAD", status: "ACCEPTED" },
          { userId: memberUser.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: clientUser.id, role: "CLIENT", status: "ACCEPTED" },
          { userId: developer1.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: developer2.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: designer.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: qaEngineer.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
        ],
      },
    },
  })

  // Create Project Template
  console.log("📋 Creating project template...")
  await prisma.projectTemplate.create({
    data: {
      name: "Agile Sprint Template",
      description: "Standard agile project with sprints",
      config: JSON.stringify({
        phases: ["Planning", "Development", "Testing", "Deployment"],
        tasks: ["Requirements", "Design", "Implementation", "Code Review", "QA"],
      }),
      createdBy: adminUser.id,
    },
  })

  await prisma.projectTemplate.create({
    data: {
      name: "Waterfall Project Template",
      description: "Traditional waterfall methodology",
      config: JSON.stringify({
        phases: ["Requirements", "Design", "Implementation", "Verification", "Maintenance"],
        tasks: ["Document Requirements", "Create Design", "Develop", "Test", "Deploy"],
      }),
      createdBy: adminUser.id,
    },
  })

  await prisma.projectTemplate.create({
    data: {
      name: "Kanban Workflow",
      description: "Continuous flow Kanban board",
      config: JSON.stringify({
        phases: ["Backlog", "In Progress", "Review", "Done"],
        tasks: ["Plan", "Execute", "Review", "Ship"],
      }),
      createdBy: managerUser.id,
    },
  })

  // Create Projects
  console.log("📁 Creating projects...")
  const project1 = await prisma.project.create({
    data: {
      name: "E-Commerce Platform",
      description: "Building a modern e-commerce platform with React and Node.js",
      status: "IN_PROGRESS",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      ownerId: adminUser.id,
      organizationId: org.id,
      members: {
        create: [
          { userId: adminUser.id, role: "PROJECT_ADMIN", status: "ACCEPTED" },
          { userId: managerUser.id, role: "PROJECT_MANAGER", status: "ACCEPTED" },
          { userId: leadUser.id, role: "TEAM_LEAD", status: "ACCEPTED" },
          { userId: memberUser.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: developer1.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: developer2.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: designer.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: qaEngineer.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
        ],
      },
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: "Mobile App Redesign",
      description: "Redesigning the mobile app for better UX",
      status: "PLANNING",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-04-30"),
      ownerId: managerUser.id,
      organizationId: org.id,
      members: {
        create: [
          { userId: managerUser.id, role: "PROJECT_MANAGER", status: "ACCEPTED" },
          { userId: leadUser.id, role: "TEAM_LEAD", status: "ACCEPTED" },
          { userId: designer.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: developer1.id, role: "TEAM_MEMBER", status: "ACCEPTED" }, // Sarah on MULTIPLE projects
          { userId: clientUser.id, role: "CLIENT", status: "ACCEPTED" },
        ],
      },
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: "API Integration",
      description: "Integrating third-party APIs for payment and shipping",
      status: "COMPLETED",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-12-31"),
      ownerId: adminUser.id,
      organizationId: org.id,
      members: {
        create: [
          { userId: adminUser.id, role: "PROJECT_ADMIN", status: "ACCEPTED" },
          { userId: memberUser.id, role: "TEAM_MEMBER", status: "ACCEPTED" },
          { userId: developer1.id, role: "TEAM_MEMBER", status: "ACCEPTED" }, // Sarah on 3 projects total
          { userId: developer2.id, role: "TEAM_MEMBER", status: "ACCEPTED" }, // Michael on 2 projects
          { userId: qaEngineer.id, role: "TEAM_MEMBER", status: "ACCEPTED" }, // David on 2 projects
        ],
      },
    },
  })

  // Create Phases
  console.log("📊 Creating phases...")
  const phases = await Promise.all([
    prisma.phase.create({
      data: { name: "Planning", projectId: project1.id, sequence: 1, status: "completed" },
    }),
    prisma.phase.create({
      data: { name: "Development", projectId: project1.id, sequence: 2, status: "in-progress" },
    }),
    prisma.phase.create({
      data: { name: "Testing", projectId: project1.id, sequence: 3, status: "pending" },
    }),
    prisma.phase.create({
      data: { name: "Deployment", projectId: project1.id, sequence: 4, status: "pending" },
    }),
  ])

  // Create Milestones
  console.log("🎯 Creating milestones...")
  const milestone1 = await prisma.milestone.create({
    data: {
      title: "MVP Launch",
      description: "Launch the minimum viable product",
      dueDate: new Date("2026-03-15"),
      status: "IN_PROGRESS",
      projectId: project1.id,
    },
  })

  const milestone2 = await prisma.milestone.create({
    data: {
      title: "Beta Release",
      description: "Release beta version for testing",
      dueDate: new Date("2026-05-01"),
      status: "NOT_STARTED",
      projectId: project1.id,
    },
  })

  await prisma.milestone.create({
    data: {
      title: "Design Approval",
      description: "Get stakeholder approval on new designs",
      dueDate: new Date("2026-02-28"),
      status: "NOT_STARTED",
      projectId: project2.id,
    },
  })

  // Create Teams
  console.log("👥 Creating teams...")
  const team1 = await prisma.team.create({
    data: {
      name: "Frontend Team",
      description: "Responsible for UI/UX development",
      projectId: project1.id,
      members: {
        create: [
          { userId: leadUser.id, role: "LEAD" },
          { userId: memberUser.id, role: "MEMBER" },
          { userId: designer.id, role: "MEMBER" },
        ],
      },
    },
  })

  const team2 = await prisma.team.create({
    data: {
      name: "Backend Team",
      description: "Responsible for API and database",
      projectId: project1.id,
      members: {
        create: [
          { userId: managerUser.id, role: "LEAD" },
          { userId: developer1.id, role: "MEMBER" },
          { userId: developer2.id, role: "MEMBER" },
        ],
      },
    },
  })

  const team3 = await prisma.team.create({
    data: {
      name: "QA Team",
      description: "Quality assurance and testing",
      projectId: project1.id,
      members: {
        create: [
          { userId: qaEngineer.id, role: "LEAD" },
        ],
      },
    },
  })

  // Create Tasks
  console.log("✅ Creating tasks...")
  const task1 = await prisma.task.create({
    data: {
      title: "Set up project structure",
      description: "Initialize the project with Next.js and configure build tools",
      status: "DONE",
      priority: "HIGH",
      dueDate: new Date("2026-01-15"),
      projectId: project1.id,
      createdBy: managerUser.id,
      milestoneId: milestone1.id,
      assignees: {
        create: { userId: leadUser.id },
      },
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: "Implement authentication",
      description: "Add user login, signup, and JWT authentication",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date("2026-01-25"),
      projectId: project1.id,
      createdBy: managerUser.id,
      milestoneId: milestone1.id,
      assignees: {
        create: { userId: memberUser.id },
      },
    },
  })

  const task3 = await prisma.task.create({
    data: {
      title: "Design product catalog",
      description: "Create UI for product listing and detail pages",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date("2026-02-10"),
      projectId: project1.id,
      createdBy: managerUser.id,
      milestoneId: milestone1.id,
      assignees: {
        create: { userId: leadUser.id },
      },
    },
  })

  const task4 = await prisma.task.create({
    data: {
      title: "Implement shopping cart",
      description: "Build shopping cart functionality with add/remove items",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date("2026-02-20"),
      projectId: project1.id,
      createdBy: managerUser.id,
      milestoneId: milestone2.id,
      assignees: {
        create: { userId: memberUser.id },
      },
    },
  })

  const task5 = await prisma.task.create({
    data: {
      title: "Payment integration",
      description: "Integrate Stripe for payment processing",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date("2026-03-01"),
      projectId: project1.id,
      createdBy: adminUser.id,
      milestoneId: milestone2.id,
      assignees: {
        create: { userId: leadUser.id },
      },
    },
  })

  const task6 = await prisma.task.create({
    data: {
      title: "Design homepage",
      description: "Create modern homepage design with hero section",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date("2026-01-28"),
      projectId: project1.id,
      createdBy: managerUser.id,
      milestoneId: milestone1.id,
      assignees: {
        create: { userId: designer.id },
      },
    },
  })

  const task7 = await prisma.task.create({
    data: {
      title: "API documentation",
      description: "Write comprehensive API documentation",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date("2026-02-15"),
      projectId: project1.id,
      createdBy: managerUser.id,
      milestoneId: milestone1.id,
      assignees: {
        create: { userId: developer1.id },
      },
    },
  })

  const task8 = await prisma.task.create({
    data: {
      title: "Database optimization",
      description: "Optimize database queries and add indexes",
      status: "TODO",
      priority: "LOW",
      dueDate: new Date("2026-03-10"),
      projectId: project1.id,
      createdBy: adminUser.id,
      assignees: {
        create: { userId: developer2.id },
      },
    },
  })

  const task9 = await prisma.task.create({
    data: {
      title: "Write integration tests",
      description: "Create comprehensive test suite for APIs",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date("2026-02-05"),
      projectId: project1.id,
      createdBy: managerUser.id,
      milestoneId: milestone1.id,
      assignees: {
        create: { userId: qaEngineer.id },
      },
    },
  })

  const task10 = await prisma.task.create({
    data: {
      title: "Mobile responsiveness",
      description: "Ensure all pages work perfectly on mobile devices",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date("2026-02-25"),
      projectId: project2.id,
      createdBy: managerUser.id,
      assignees: {
        create: { userId: designer.id },
      },
    },
  })

  // Create Subtasks
  console.log("📝 Creating subtasks...")
  await prisma.subTask.createMany({
    data: [
      { title: "Set up JWT middleware", taskId: task2.id, completed: true },
      { title: "Create login form", taskId: task2.id, completed: true },
      { title: "Create signup form", taskId: task2.id, completed: false },
      { title: "Add password reset", taskId: task2.id, completed: false },
      { title: "Create product grid component", taskId: task3.id, completed: false },
      { title: "Create product detail page", taskId: task3.id, completed: false },
      { title: "Add to cart functionality", taskId: task4.id, completed: false },
      { title: "Remove from cart", taskId: task4.id, completed: false },
      { title: "Update quantity", taskId: task4.id, completed: false },
      { title: "Design hero section", taskId: task6.id, completed: true },
      { title: "Add featured products", taskId: task6.id, completed: true },
      { title: "Create testimonials section", taskId: task6.id, completed: false },
      { title: "Write endpoint documentation", taskId: task7.id, completed: false },
      { title: "Add code examples", taskId: task7.id, completed: false },
      { title: "Create authentication guide", taskId: task7.id, completed: false },
      { title: "Write unit tests", taskId: task9.id, completed: true },
      { title: "Write API tests", taskId: task9.id, completed: false },
      { title: "Write E2E tests", taskId: task9.id, completed: false },
    ],
  })

  // Create Task Dependencies
  console.log("🔗 Creating task dependencies...")
  await prisma.taskDependency.create({
    data: {
      parentTaskId: task1.id,
      childTaskId: task3.id,
      type: "BLOCKED_BY",
    },
  })

  await prisma.taskDependency.create({
    data: {
      parentTaskId: task3.id,
      childTaskId: task4.id,
      type: "BLOCKED_BY",
    },
  })

  await prisma.taskDependency.create({
    data: {
      parentTaskId: task4.id,
      childTaskId: task5.id,
      type: "BLOCKED_BY",
    },
  })

  // Create Issues
  console.log("🐛 Creating issues...")
  const issue1 = await prisma.issue.create({
    data: {
      title: "Login button not working on mobile",
      description: "The login button is unresponsive on iOS devices",
      status: "OPEN",
      priority: "HIGH",
      projectId: project1.id,
      reportedBy: memberUser.id,
      assigneeId: leadUser.id,
    },
  })

  await prisma.issue.create({
    data: {
      title: "Slow page load on product listing",
      description: "Product listing page takes more than 5 seconds to load",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: project1.id,
      reportedBy: leadUser.id,
      assigneeId: memberUser.id,
    },
  })

  await prisma.issue.create({
    data: {
      title: "Cart total calculation error",
      description: "Cart shows wrong total when applying discount codes",
      status: "OPEN",
      priority: "HIGH",
      projectId: project1.id,
      reportedBy: managerUser.id,
    },
  })

  await prisma.issue.create({
    data: {
      title: "CSS not loading on Safari",
      description: "Styles are broken on Safari browser",
      status: "RESOLVED",
      priority: "MEDIUM",
      projectId: project1.id,
      reportedBy: designer.id,
      assigneeId: developer1.id,
    },
  })

  await prisma.issue.create({
    data: {
      title: "Memory leak in dashboard",
      description: "Dashboard component is causing memory leak",
      status: "OPEN",
      priority: "CRITICAL",
      projectId: project1.id,
      reportedBy: qaEngineer.id,
      assigneeId: developer2.id,
    },
  })

  await prisma.issue.create({
    data: {
      title: "404 error on profile page",
      description: "Profile page returns 404 for some users",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: project1.id,
      reportedBy: clientUser.id,
      assigneeId: leadUser.id,
    },
  })

  // Create Documents
  console.log("📄 Creating documents...")
  const doc1 = await prisma.document.create({
    data: {
      title: "Project Requirements",
      description: "Detailed requirements document for the e-commerce platform",
      projectId: project1.id,
      createdBy: managerUser.id,
      currentVersion: 2,
    },
  })

  await prisma.documentVersion.createMany({
    data: [
      {
        documentId: doc1.id,
        versionNumber: 1,
        fileUrl: "data:text/plain;base64,UmVxdWlyZW1lbnRzIHYx",
        fileName: "requirements-v1.pdf",
        fileSize: 102400,
        fileType: "application/pdf",
        changeLog: "Initial version",
        createdBy: managerUser.id,
      },
      {
        documentId: doc1.id,
        versionNumber: 2,
        fileUrl: "data:text/plain;base64,UmVxdWlyZW1lbnRzIHYy",
        fileName: "requirements-v2.pdf",
        fileSize: 153600,
        fileType: "application/pdf",
        changeLog: "Added payment requirements",
        createdBy: managerUser.id,
      },
    ],
  })

  const doc2 = await prisma.document.create({
    data: {
      title: "API Documentation",
      description: "REST API documentation for developers",
      projectId: project1.id,
      createdBy: leadUser.id,
      currentVersion: 1,
    },
  })

  await prisma.documentVersion.create({
    data: {
      documentId: doc2.id,
      versionNumber: 1,
      fileUrl: "data:text/plain;base64,QVBJIERvY3M=",
      fileName: "api-docs.md",
      fileSize: 51200,
      fileType: "text/markdown",
      changeLog: "Initial API documentation",
      createdBy: leadUser.id,
    },
  })

  const doc3 = await prisma.document.create({
    data: {
      title: "Design System",
      description: "UI/UX design system and guidelines",
      projectId: project1.id,
      createdBy: designer.id,
      currentVersion: 3,
    },
  })

  await prisma.documentVersion.createMany({
    data: [
      {
        documentId: doc3.id,
        versionNumber: 1,
        fileUrl: "data:text/plain;base64,RGVzaWdudjE=",
        fileName: "design-system-v1.fig",
        fileSize: 2048000,
        fileType: "application/figma",
        changeLog: "Initial design system",
        createdBy: designer.id,
      },
      {
        documentId: doc3.id,
        versionNumber: 2,
        fileUrl: "data:text/plain;base64,RGVzaWdudjI=",
        fileName: "design-system-v2.fig",
        fileSize: 2150000,
        fileType: "application/figma",
        changeLog: "Added dark mode variants",
        createdBy: designer.id,
      },
      {
        documentId: doc3.id,
        versionNumber: 3,
        fileUrl: "data:text/plain;base64,RGVzaWdudjM=",
        fileName: "design-system-v3.fig",
        fileSize: 2300000,
        fileType: "application/figma",
        changeLog: "Added mobile components",
        createdBy: designer.id,
      },
    ],
  })

  await prisma.document.create({
    data: {
      title: "Test Strategy",
      description: "QA test strategy and test cases",
      projectId: project1.id,
      createdBy: qaEngineer.id,
      currentVersion: 1,
    },
  })

  // Create Comments
  console.log("💬 Creating comments...")
  await prisma.comment.createMany({
    data: [
      {
        content: "Great progress on the authentication module!",
        taskId: task2.id,
        projectId: project1.id,
        authorId: managerUser.id,
      },
      {
        content: "We need to add rate limiting to the login endpoint",
        taskId: task2.id,
        projectId: project1.id,
        authorId: leadUser.id,
      },
      {
        content: "This is blocking the shopping cart feature",
        taskId: task4.id,
        projectId: project1.id,
        authorId: memberUser.id,
      },
      {
        content: "I've completed the hero section design. @Team Lead please review",
        taskId: task6.id,
        projectId: project1.id,
        authorId: designer.id,
      },
      {
        content: "The color scheme looks amazing! Approved ✅",
        taskId: task6.id,
        projectId: project1.id,
        authorId: leadUser.id,
      },
      {
        content: "Should we use TypeScript or JavaScript for the documentation examples?",
        taskId: task7.id,
        projectId: project1.id,
        authorId: developer1.id,
      },
      {
        content: "Let's use TypeScript for type safety",
        taskId: task7.id,
        projectId: project1.id,
        authorId: managerUser.id,
      },
      {
        content: "Found a critical bug in the payment flow. Creating an issue.",
        taskId: task5.id,
        projectId: project1.id,
        authorId: qaEngineer.id,
      },
      {
        content: "API tests are passing. Moving to E2E tests next.",
        taskId: task9.id,
        projectId: project1.id,
        authorId: qaEngineer.id,
      },
      {
        content: "Database queries are now 50% faster after optimization",
        taskId: task8.id,
        projectId: project1.id,
        authorId: developer2.id,
      },
    ],
  })

  // Create Timesheets
  console.log("⏱️ Creating timesheets...")
  const today = new Date()
  await prisma.timesheet.createMany({
    data: [
      {
        userId: leadUser.id,
        taskId: task1.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
        hoursLogged: 4,
        description: "Set up Next.js project structure",
        status: "APPROVED",
      },
      {
        userId: leadUser.id,
        taskId: task1.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4),
        hoursLogged: 6,
        description: "Configured build tools and linting",
        status: "APPROVED",
      },
      {
        userId: memberUser.id,
        taskId: task2.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
        hoursLogged: 8,
        description: "Implemented JWT authentication",
        status: "APPROVED",
      },
      {
        userId: memberUser.id,
        taskId: task2.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
        hoursLogged: 6,
        description: "Created login and signup forms",
        status: "PENDING",
      },
      {
        userId: leadUser.id,
        taskId: task3.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
        hoursLogged: 5,
        description: "Started product catalog design",
        status: "PENDING",
      },
      {
        userId: designer.id,
        taskId: task6.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
        hoursLogged: 7,
        description: "Created hero section mockups",
        status: "APPROVED",
      },
      {
        userId: designer.id,
        taskId: task6.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4),
        hoursLogged: 8,
        description: "Implemented responsive design",
        status: "APPROVED",
      },
      {
        userId: developer1.id,
        taskId: task7.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
        hoursLogged: 5,
        description: "Writing API endpoint documentation",
        status: "PENDING",
      },
      {
        userId: developer2.id,
        taskId: task8.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
        hoursLogged: 6,
        description: "Database query optimization",
        status: "PENDING",
      },
      {
        userId: qaEngineer.id,
        taskId: task9.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
        hoursLogged: 7,
        description: "Writing integration test cases",
        status: "PENDING",
      },
      {
        userId: qaEngineer.id,
        taskId: task9.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        hoursLogged: 4,
        description: "Running test suite and fixing failures",
        status: "DRAFT",
      },
    ],
  })

  // Create Activity Logs
  console.log("📋 Creating activity logs...")
  await prisma.activityLog.createMany({
    data: [
      {
        action: "created",
        entity: "Project",
        entityId: project1.id,
        projectId: project1.id,
        userId: adminUser.id,
      },
      {
        action: "created",
        entity: "Task",
        entityId: task1.id,
        projectId: project1.id,
        userId: managerUser.id,
      },
      {
        action: "completed",
        entity: "Task",
        entityId: task1.id,
        projectId: project1.id,
        userId: leadUser.id,
        changes: JSON.stringify({ status: { from: "IN_PROGRESS", to: "DONE" } }),
      },
      {
        action: "created",
        entity: "Issue",
        entityId: issue1.id,
        projectId: project1.id,
        userId: memberUser.id,
      },
      {
        action: "assigned",
        entity: "Issue",
        entityId: issue1.id,
        projectId: project1.id,
        userId: managerUser.id,
        changes: JSON.stringify({ assignee: leadUser.name }),
      },
    ],
  })

  // Create Notifications
  console.log("🔔 Creating notifications...")
  await prisma.notification.createMany({
    data: [
      {
        userId: leadUser.id,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: "You have been assigned to 'Design product catalog'",
        read: false,
      },
      {
        userId: memberUser.id,
        type: "ISSUE_ASSIGNED",
        title: "Issue assigned",
        message: "You have been assigned to fix 'Slow page load on product listing'",
        read: false,
      },
      {
        userId: managerUser.id,
        type: "COMMENT_ADDED",
        title: "New comment",
        message: "Team Lead commented on 'Implement authentication'",
        read: true,
      },
      {
        userId: adminUser.id,
        type: "MILESTONE_DUE",
        title: "Milestone approaching",
        message: "MVP Launch milestone is due in 2 months",
        read: false,
      },
      {
        userId: designer.id,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: "You have been assigned to 'Design homepage'",
        read: true,
      },
      {
        userId: developer1.id,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: "You have been assigned to 'API documentation'",
        read: false,
      },
      {
        userId: developer2.id,
        type: "COMMENT_ADDED",
        title: "New comment",
        message: "Project Manager mentioned you in a comment",
        read: false,
      },
      {
        userId: qaEngineer.id,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: "You have been assigned to 'Write integration tests'",
        read: true,
      },
      {
        userId: clientUser.id,
        type: "PROJECT_UPDATE",
        title: "Project update",
        message: "Mobile App Redesign project has been updated",
        read: false,
      },
      {
        userId: leadUser.id,
        type: "TIMESHEET_APPROVED",
        title: "Timesheet approved",
        message: "Your timesheet for last week has been approved",
        read: true,
      },
    ],
  })

  // Create Attachments
  console.log("📎 Creating attachments...")
  await prisma.attachment.createMany({
    data: [
      {
        fileName: "screenshot-login-bug.png",
        fileUrl: "data:image/png;base64,iVBORw0KGgoAAAANS",
        fileSize: 245760,
        fileType: "image/png",
        taskId: task2.id,
        uploadedBy: memberUser.id,
      },
      {
        fileName: "wireframes.fig",
        fileUrl: "data:application/figma;base64,RmlnbWFGaWxl",
        fileSize: 1048576,
        fileType: "application/figma",
        taskId: task6.id,
        uploadedBy: designer.id,
      },
      {
        fileName: "api-spec.json",
        fileUrl: "data:application/json;base64,eyJhcGkiOiJ0ZXN0In0=",
        fileSize: 8192,
        fileType: "application/json",
        taskId: task7.id,
        uploadedBy: developer1.id,
      },
      {
        fileName: "test-report.pdf",
        fileUrl: "data:application/pdf;base64,JVBERi0xLjQK",
        fileSize: 524288,
        fileType: "application/pdf",
        taskId: task9.id,
        uploadedBy: qaEngineer.id,
      },
    ],
  })

  // Create Report Exports
  console.log("📊 Creating report exports...")
  await prisma.reportExport.createMany({
    data: [
      {
        projectId: project1.id,
        type: "TASK_COMPLETION",
        format: "CSV",
        status: "COMPLETED",
        fileUrl: "data:text/csv;base64,dGFzayxzdGF0dXMKdGFzazEsZG9uZQ==",
        createdBy: managerUser.id,
      },
      {
        projectId: project1.id,
        type: "TIME_UTILIZATION",
        format: "PDF",
        status: "COMPLETED",
        fileUrl: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK",
        createdBy: managerUser.id,
      },
      {
        projectId: project2.id,
        type: "PROJECT_PROGRESS",
        format: "JSON",
        status: "COMPLETED",
        fileUrl: "data:application/json;base64,eyJwcm9ncmVzcyI6MjV9",
        createdBy: managerUser.id,
      },
    ],
  })

  console.log("✅ Seed completed successfully!")
  console.log("\n📝 Test Accounts:")
  console.log("   Admin:     admin@test.com / password123")
  console.log("   Manager:   manager@test.com / password123")
  console.log("   Lead:      lead@test.com / password123")
  console.log("   Member:    member@test.com / password123")
  console.log("   Client:    client@test.com / password123")
  console.log("   Developer: dev1@test.com / password123")
  console.log("   Developer: dev2@test.com / password123")
  console.log("   Designer:  designer@test.com / password123")
  console.log("   QA:        qa@test.com / password123")
  console.log("\n📊 Data Created:")
  console.log("   ✅ 9 Users")
  console.log("   ✅ 1 Organization")
  console.log("   ✅ 3 Project Templates")
  console.log("   ✅ 3 Projects")
  console.log("   ✅ 4 Phases")
  console.log("   ✅ 3 Milestones")
  console.log("   ✅ 3 Teams")
  console.log("   ✅ 10 Tasks")
  console.log("   ✅ 18 Subtasks")
  console.log("   ✅ 3 Task Dependencies")
  console.log("   ✅ 6 Issues")
  console.log("   ✅ 4 Documents")
  console.log("   ✅ 7 Document Versions")
  console.log("   ✅ 10 Comments")
  console.log("   ✅ 11 Timesheets")
  console.log("   ✅ 5 Activity Logs")
  console.log("   ✅ 10 Notifications")
  console.log("   ✅ 4 Attachments")
  console.log("   ✅ 3 Report Exports")
  console.log("\n💡 Multi-Project Members:")
  console.log("   🔸 Sarah (dev1@test.com) - Working on ALL 3 projects")
  console.log("   🔸 Michael (dev2@test.com) - E-Commerce + API Integration")
  console.log("   🔸 David (qa@test.com) - E-Commerce + API Integration")

}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
