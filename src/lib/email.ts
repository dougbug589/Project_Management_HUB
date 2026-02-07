import nodemailer from 'nodemailer';

// Configure email transporter (using SendGrid SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key',
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@projectmanagement.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html,
    });
    console.log('Email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendTaskAssignmentEmail(
  userEmail: string,
  userName: string,
  taskTitle: string,
  projectName: string,
  taskId: string
) {
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${taskId}`;
  const html = `
    <h2>Task Assigned to You</h2>
    <p>Hi ${userName},</p>
    <p>You have been assigned a new task:</p>
    <p><strong>${taskTitle}</strong></p>
    <p>Project: ${projectName}</p>
    <p><a href="${taskUrl}">View Task</a></p>
    <p>Best regards,<br>Project Management Team</p>
  `;

  return sendEmail({
    to: userEmail,
    subject: `New Task Assigned: ${taskTitle}`,
    html,
  });
}

export async function sendTaskStatusChangeEmail(
  userEmail: string,
  userName: string,
  taskTitle: string,
  oldStatus: string,
  newStatus: string,
  taskId: string
) {
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${taskId}`;
  const html = `
    <h2>Task Status Updated</h2>
    <p>Hi ${userName},</p>
    <p>A task has been updated:</p>
    <p><strong>${taskTitle}</strong></p>
    <p>Status: ${oldStatus} → ${newStatus}</p>
    <p><a href="${taskUrl}">View Task</a></p>
    <p>Best regards,<br>Project Management Team</p>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Task Status Updated: ${taskTitle}`,
    html,
  });
}

export async function sendCommentNotificationEmail(
  userEmail: string,
  userName: string,
  commenterName: string,
  taskTitle: string,
  comment: string,
  taskId: string
) {
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${taskId}`;
  const html = `
    <h2>New Comment on Your Task</h2>
    <p>Hi ${userName},</p>
    <p>${commenterName} commented on <strong>${taskTitle}</strong>:</p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 10px;">
      ${comment}
    </blockquote>
    <p><a href="${taskUrl}">View Task</a></p>
    <p>Best regards,<br>Project Management Team</p>
  `;

  return sendEmail({
    to: userEmail,
    subject: `New Comment: ${taskTitle}`,
    html,
  });
}

export async function sendMilestoneReminderEmail(
  userEmail: string,
  userName: string,
  milestoneName: string,
  dueDate: string,
  projectName: string
) {
  const html = `
    <h2>Milestone Reminder</h2>
    <p>Hi ${userName},</p>
    <p>Your milestone is approaching:</p>
    <p><strong>${milestoneName}</strong></p>
    <p>Project: ${projectName}</p>
    <p>Due: ${dueDate}</p>
    <p>Best regards,<br>Project Management Team</p>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Reminder: ${milestoneName} Due Soon`,
    html,
  });
}

export async function sendTimesheetApprovalEmail(
  userEmail: string,
  userName: string,
  timesheetId: string,
  hours: number,
  status: string
) {
  const html = `
    <h2>Timesheet ${status}</h2>
    <p>Hi ${userName},</p>
    <p>Your timesheet has been <strong>${status}</strong>.</p>
    <p>Hours: ${hours}</p>
    <p>Best regards,<br>Project Management Team</p>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Timesheet ${status}`,
    html,
  });
}
