-- Add new tables for missing features

-- NotificationPreference table
CREATE TABLE NotificationPreference (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  emailOnTaskAssigned INTEGER DEFAULT 1,
  emailOnStatusChange INTEGER DEFAULT 1,
  emailOnComment INTEGER DEFAULT 1,
  emailOnMilestone INTEGER DEFAULT 1,
  emailOnOverdue INTEGER DEFAULT 1,
  digestFrequency TEXT DEFAULT 'IMMEDIATE',
  notificationTime TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Discussion table (for project discussion board)
CREATE TABLE Discussion (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  authorId TEXT NOT NULL,
  pinned INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES Project(id),
  FOREIGN KEY (authorId) REFERENCES User(id)
);

CREATE INDEX idx_discussion_projectId ON Discussion(projectId);
CREATE INDEX idx_discussion_authorId ON Discussion(authorId);

-- DiscussionReply table
CREATE TABLE DiscussionReply (
  id TEXT PRIMARY KEY,
  discussionId TEXT NOT NULL,
  content TEXT NOT NULL,
  authorId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discussionId) REFERENCES Discussion(id),
  FOREIGN KEY (authorId) REFERENCES User(id)
);

CREATE INDEX idx_discussionReply_discussionId ON DiscussionReply(discussionId);
CREATE INDEX idx_discussionReply_authorId ON DiscussionReply(authorId);

-- TimerSession table (for timer-based tracking)
CREATE TABLE TimerSession (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  userId TEXT NOT NULL,
  startTime DATETIME NOT NULL,
  endTime DATETIME,
  duration REAL,
  isActive INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (taskId) REFERENCES Task(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX idx_timerSession_taskId ON TimerSession(taskId);
CREATE INDEX idx_timerSession_userId ON TimerSession(userId);
CREATE INDEX idx_timerSession_isActive ON TimerSession(isActive);

-- Client table (for Client Portal)
CREATE TABLE Client (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  organizationId TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  accessLevel TEXT DEFAULT 'VIEWER',
  projectIds TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastLogin DATETIME,
  FOREIGN KEY (organizationId) REFERENCES Organization(id)
);

CREATE INDEX idx_client_organizationId ON Client(organizationId);
CREATE INDEX idx_client_status ON Client(status);
