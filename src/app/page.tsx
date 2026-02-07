'use client';

import Link from 'next/link';
import { 
  FolderKanban, CheckSquare, Users, MessageSquare, Clock, 
  BarChart3, FileText, Bell, Target, Layers, Shield
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: 'Projects & Organizations',
      description: 'Create organizations and manage multiple projects with team access control',
      icon: FolderKanban,
      color: 'text-blue-400',
    },
    {
      title: 'Tasks & Subtasks',
      description: 'Break down work into tasks with priorities, due dates, and subtasks',
      icon: CheckSquare,
      color: 'text-green-400',
    },
    {
      title: 'Team Management',
      description: 'Create teams, assign members, and collaborate effectively',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      title: 'Milestones & Phases',
      description: 'Track project progress with milestones and organized phases',
      icon: Target,
      color: 'text-orange-400',
    },
    {
      title: 'Time Tracking',
      description: 'Log hours with timesheets and track time spent on tasks',
      icon: Clock,
      color: 'text-cyan-400',
    },
    {
      title: 'Issue Tracking',
      description: 'Report and manage bugs with priority levels and assignments',
      icon: Layers,
      color: 'text-red-400',
    },
    {
      title: 'Comments & Attachments',
      description: 'Discuss tasks with comments and attach files',
      icon: MessageSquare,
      color: 'text-yellow-400',
    },
    {
      title: 'Reports & Export',
      description: 'Generate reports and export data in CSV or JSON format',
      icon: BarChart3,
      color: 'text-indigo-400',
    },
    {
      title: 'Documents',
      description: 'Store project documents with version history',
      icon: FileText,
      color: 'text-pink-400',
    },
    {
      title: 'Notifications',
      description: 'Stay updated with real-time notifications',
      icon: Bell,
      color: 'text-amber-400',
    },
    {
      title: 'Project Templates',
      description: 'Save and reuse project configurations as templates',
      icon: Layers,
      color: 'text-teal-400',
    },
    {
      title: 'Role-Based Access',
      description: 'Control permissions with admin, manager, lead, and member roles',
      icon: Shield,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-cyan-400">
            ProjectHub
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/login"
              className="px-5 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Project Management
            <span className="text-cyan-400"> Made Simple</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Organize projects, track tasks, manage teams, and deliver on time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-12">
            Features
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-5 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-600 transition-colors"
                >
                  {/* eslint-disable-next-line react/no-unknown-property */}
                  <Icon className={`w-6 h-6 ${feature.color} mb-3`} suppressHydrationWarning />
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to start?</h2>
          <p className="text-gray-400 mb-6">
            Create your free account and start managing projects today.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 ProjectHub
          </p>
        </div>
      </footer>
    </div>
  );
}
