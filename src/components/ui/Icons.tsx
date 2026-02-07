"use client"
// Removed duplicate export of UserPlus

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Home,
  FolderKanban,
  CheckSquare,
  Bug,
  Target,
  Clock,
  Users,
  FileText,
  User,
  Settings,
  LogOut,
  Bell,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Download,
  Upload,
  Link,
  ExternalLink,
  Calendar,
  CalendarDays,
  Timer,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  MoreVertical,
  Menu,
  Loader2,
  RefreshCw,
  Archive,
  ArchiveRestore,
  Send,
  MessageSquare,
  Paperclip,
  Image,
  File,
  Folder,
  FolderOpen,
  Star,
  StarOff,
  Heart,
  Bookmark,
  Share2,
  Copy,
  Clipboard,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Laptop,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  Unlock,
  Key,
  Shield,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  UsersRound,
  Building,
  Briefcase,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  Activity,
  Zap,
  Award,
  Flag,
  Milestone,
  GitBranch,
  GitCommit,
  GitMerge,
  Layers,
  Layout,
  LayoutDashboard,
  List,
  Grid,
  Table,
  Kanban,
  type LucideIcon,
} from "lucide-react"

// Icon size presets
export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const

export type IconSize = keyof typeof iconSizes

// Icon wrapper component for consistent styling
interface IconProps {
  icon: LucideIcon
  size?: IconSize | number
  className?: string
  strokeWidth?: number
}

export function Icon({ icon: IconComponent, size = "md", className = "", strokeWidth = 2 }: IconProps) {
  const sizeValue = typeof size === "number" ? size : iconSizes[size]
  return <IconComponent size={sizeValue} strokeWidth={strokeWidth} className={className} />
}

// Pre-configured icon exports for common use cases
export const Icons = {
  // Navigation
  home: Home,
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  tasks: CheckSquare,
  issues: Bug,
  milestones: Target,
  timesheets: Clock,
  teams: Users,
  documents: FileText,
  profile: User,
  settings: Settings,
  logout: LogOut,
  
  // Actions
  add: Plus,
  create: Plus,
  search: Search,
  filter: Filter,
  edit: Edit,
  delete: Trash2,
  view: Eye,
  hide: EyeOff,
  download: Download,
  upload: Upload,
  save: Save,
  send: Send,
  share: Share2,
  copy: Copy,
  link: Link,
  externalLink: ExternalLink,
  refresh: RefreshCw,
  archive: Archive,
  unarchive: ArchiveRestore,
  undo: Undo,
  redo: Redo,
  
  // UI
  menu: Menu,
  close: X,
  check: Check,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  loader: Loader2,
  
  // Status & Alerts
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
  alert: AlertCircle,
  
  // Communication
  notification: Bell,
  comment: MessageSquare,
  message: Mail,
  attachment: Paperclip,
  
  // Files
  file: File,
  fileText: FileText,
  image: Image,
  folder: Folder,
  folderOpen: FolderOpen,
  
  // Time
  calendar: Calendar,
  calendarDays: CalendarDays,
  clock: Clock,
  timer: Timer,
  play: Play,
  pause: Pause,
  stop: Square,
  
  // Users
  user: User,
  userPlus: UserPlus,
  userMinus: UserMinus,
  userCheck: UserCheck,
  userX: UserX,
  users: Users,
  usersRound: UsersRound,
  
  // Organization
  building: Building,
  briefcase: Briefcase,
  
  // Security
  lock: Lock,
  unlock: Unlock,
  key: Key,
  shield: Shield,
  
  // Analytics
  chart: BarChart2,
  pieChart: PieChart,
  activity: Activity,
  trendUp: TrendingUp,
  trendDown: TrendingDown,
  
  // Misc
  star: Star,
  starOff: StarOff,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  award: Award,
  zap: Zap,
  layers: Layers,
  
  // Views
  list: List,
  grid: Grid,
  table: Table,
  kanban: Kanban,
  
  // Theme
  sun: Sun,
  moon: Moon,
  laptop: Laptop,
  
  // Git/Version
  branch: GitBranch,
  commit: GitCommit,
  merge: GitMerge,
  milestone: Milestone,
  
  // Zoom
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  maximize: Maximize,
  minimize: Minimize,
} as const

export type IconName = keyof typeof Icons

// Helper to get icon by name
export function getIcon(name: IconName): LucideIcon {
  return Icons[name]
}

export {
  Home,
  FolderKanban,
  CheckSquare,
  Bug,
  Target,
  Clock,
  Users,
  FileText,
  User,
  UserPlus,
  Settings,
  LogOut,
  Bell,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  Calendar,
  Timer,
  Play,
  Pause,
  Menu,
  Loader2,
  RefreshCw,
  Archive,
  Send,
  MessageSquare,
  Paperclip,
  File,
  Folder,
  BarChart2,
  Activity,
  TrendingUp,
  LayoutDashboard,
  type LucideIcon,
}
