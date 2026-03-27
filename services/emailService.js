/**
 * Email Service for Course Popularity Analyzer
 * 
 * Supported Email Providers:
 * - SendGrid API (recommended - no server setup needed)
 * - SMTP (requires nodemailer - npm install nodemailer)
 * 
 * Setup:
 * 1. Choose an email provider
 * 2. Add credentials to .env file
 * 3. Configure EMAIL_PROVIDER in .env
 */

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'sendgrid';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@courseanalyzer.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Course Popularity Analyzer';
    this.isConfigured = this.validateConfiguration();
  }

  /**
   * Validate email service configuration
   */
  validateConfiguration() {
    if (this.provider === 'sendgrid') {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️  SendGrid API key not found. Email notifications disabled.');
        console.warn('   Set SENDGRID_API_KEY in .env to enable email features.');
        return false;
      }
      return true;
    }

    if (this.provider === 'smtp') {
      if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
        console.warn('⚠️  SMTP credentials not found. Email notifications disabled.');
        console.warn('   Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
        return false;
      }
      return true;
    }

    console.warn(`⚠️  Unknown email provider: ${this.provider}`);
    return false;
  }

  /**
   * Send analysis completion email
   * @param {Object} options - Email options
   * @param {string} options.recipientEmail - User email address
   * @param {string} options.recipientName - User name
   * @param {string} options.courseName - Name of analyzed course
   * @param {Object} options.analysisData - Analysis results
   */
  async sendAnalysisCompletionEmail(options) {
    if (!this.isConfigured) {
      console.log('Email service not configured. Skipping email notification.');
      return { success: false, reason: 'Email service not configured' };
    }

    const { recipientEmail, recipientName, courseName, analysisData } = options;

    if (!recipientEmail || !courseName) {
      throw new Error('Missing required email parameters: recipientEmail and courseName');
    }

    const subject = `Your Course Analysis: ${courseName}`;
    
    const htmlContent = this.generateAnalysisEmailHTML({
      recipientName,
      courseName,
      analysisData,
      actionUrl: `${process.env.FRONTEND_URL}/history`
    });

    try {
      await this.send({
        to: recipientEmail,
        subject,
        html: htmlContent,
        text: this.generateAnalysisEmailText({
          recipientName,
          courseName,
          analysisData
        })
      });

      return { success: true, message: `Analysis email sent to ${recipientEmail}` };
    } catch (error) {
      console.error('Failed to send analysis email:', error);
      throw error;
    }
  }

  /**
   * Send trending course alert email
   * @param {Object} options - Email options
   * @param {string} options.recipientEmail - User email address
   * @param {string} options.recipientName - User name
   * @param {string} options.courseName - Trending course name
   * @param {Object} options.courseData - Course metrics
   */
  async sendTrendingCourseAlert(options) {
    if (!this.isConfigured) {
      console.log('Email service not configured. Skipping trending alert.');
      return { success: false, reason: 'Email service not configured' };
    }

    const { recipientEmail, recipientName, courseName, courseData } = options;

    if (!recipientEmail || !courseName) {
      throw new Error('Missing required email parameters: recipientEmail and courseName');
    }

    const subject = `🚀 ${courseName} is now Trending!`;
    
    const htmlContent = this.generateTrendingEmailHTML({
      recipientName,
      courseName,
      courseData,
      actionUrl: `${process.env.FRONTEND_URL}/dashboard`
    });

    try {
      await this.send({
        to: recipientEmail,
        subject,
        html: htmlContent,
        text: this.generateTrendingEmailText({
          recipientName,
          courseName,
          courseData
        })
      });

      return { success: true, message: `Trending alert sent to ${recipientEmail}` };
    } catch (error) {
      console.error('Failed to send trending alert:', error);
      throw error;
    }
  }

  /**
   * Core send method - routes to appropriate provider
   */
  async send(options) {
    if (this.provider === 'sendgrid') {
      return this.sendViaSendGrid(options);
    }

    if (this.provider === 'smtp') {
      return this.sendViaSMTP(options);
    }

    throw new Error(`Unknown email provider: ${this.provider}`);
  }

  /**
   * Send via SendGrid API
   */
  async sendViaSendGrid(options) {
    const { to, subject, html, text } = options;

    const payload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject
        }
      ],
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      content: [
        {
          type: 'text/html',
          value: html
        },
        {
          type: 'text/plain',
          value: text
        }
      ],
      replyTo: {
        email: process.env.EMAIL_REPLY_TO || this.fromEmail
      }
    };

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SendGrid API error: ${error.errors?.[0]?.message || response.statusText}`);
      }

      return { success: true, provider: 'sendgrid' };
    } catch (error) {
      console.error('SendGrid error:', error);
      throw error;
    }
  }

  /**
   * Send via SMTP (requires nodemailer)
   * Install with: npm install nodemailer
   */
  async sendViaSMTP(options) {
    try {
      // Dynamically import nodemailer only if SMTP is configured
      const nodemailer = (await import('nodemailer')).default;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: process.env.EMAIL_REPLY_TO || this.fromEmail
      };

      const result = await transporter.sendMail(mailOptions);
      return { success: true, provider: 'smtp', messageId: result.messageId };
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('Nodemailer not installed. Run: npm install nodemailer');
      }
      console.error('SMTP error:', error);
      throw error;
    }
  }

  /**
   * Generate analysis email HTML
   */
  generateAnalysisEmailHTML(data) {
    const { recipientName, courseName, analysisData, actionUrl } = data;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { border: 1px solid #e2e8f0; padding: 20px; border-radius: 0 0 8px 8px; }
      .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
      .metric-label { font-weight: bold; }
      .metric-value { color: #3b82f6; }
      .cta-button { 
        background-color: #3b82f6; 
        color: white; 
        padding: 12px 24px; 
        text-decoration: none; 
        border-radius: 6px; 
        display: inline-block; 
        margin-top: 20px;
      }
      .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✓ Analysis Complete!</h1>
      </div>
      <div class="content">
        <p>Hi ${recipientName || 'there'},</p>
        
        <p>Your analysis for <strong>${courseName}</strong> is ready! Here's a summary of the key metrics:</p>
        
        <div class="metric">
          <span class="metric-label">Popularity Score:</span>
          <span class="metric-value">${analysisData?.popularityScore || 'N/A'}/100</span>
        </div>
        
        <div class="metric">
          <span class="metric-label">Market Demand:</span>
          <span class="metric-value">${analysisData?.marketDemand || 'N/A'}</span>
        </div>
        
        <div class="metric">
          <span class="metric-label">Trending Score:</span>
          <span class="metric-value">${analysisData?.trendingScore || 'N/A'}/100</span>
        </div>
        
        <div class="metric">
          <span class="metric-label">Learning Difficulty:</span>
          <span class="metric-value">${analysisData?.learningDifficulty || 'N/A'}</span>
        </div>
        
        <div class="metric">
          <span class="metric-label">Salary Potential (Experienced):</span>
          <span class="metric-value">$${analysisData?.salaryPotential?.experienced?.toLocaleString() || 'N/A'}</span>
        </div>
        
        <p>
          <a href="${actionUrl}" class="cta-button">View Full Analysis</a>
        </p>
        
        <p>You can export this analysis as PDF or CSV directly from your history page.</p>
      </div>
      <div class="footer">
        <p>© 2026 AI-Driven Course Popularity Analyzer. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
    `.trim();
  }

  /**
   * Generate analysis email plain text
   */
  generateAnalysisEmailText(data) {
    const { recipientName, courseName, analysisData } = data;

    return `
Hi ${recipientName || 'there'},

Your analysis for ${courseName} is ready!

KEY METRICS:
- Popularity Score: ${analysisData?.popularityScore || 'N/A'}/100
- Market Demand: ${analysisData?.marketDemand || 'N/A'}
- Trending Score: ${analysisData?.trendingScore || 'N/A'}/100
- Learning Difficulty: ${analysisData?.learningDifficulty || 'N/A'}
- Salary Potential (Experienced): $${analysisData?.salaryPotential?.experienced?.toLocaleString() || 'N/A'}

You can export this analysis as PDF or CSV from your history page.

© 2026 AI-Driven Course Popularity Analyzer
    `.trim();
  }

  /**
   * Generate trending course alert email HTML
   */
  generateTrendingEmailHTML(data) {
    const { recipientName, courseName, courseData, actionUrl } = data;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { border: 1px solid #e2e8f0; padding: 20px; border-radius: 0 0 8px 8px; }
      .highlight { background-color: #fff9e6; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 15px 0; }
      .cta-button { 
        background-color: #f59e0b; 
        color: white; 
        padding: 12px 24px; 
        text-decoration: none; 
        border-radius: 6px; 
        display: inline-block; 
        margin-top: 20px;
      }
      .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🚀 ${courseName} is Now Trending!</h1>
      </div>
      <div class="content">
        <p>Hi ${recipientName || 'there'},</p>
        
        <p>Great news! <strong>${courseName}</strong> has just entered the trending courses list because of increased popularity and market demand.</p>
        
        <div class="highlight">
          <p><strong>Why this matters:</strong></p>
          <ul>
            <li>More job opportunities emerging</li>
            <li>Growing industry demand</li>
            <li>Excellent time to invest in learning this skill</li>
            <li>Potential for higher salaries as demand increases</li>
          </ul>
        </div>
        
        <p>
          <a href="${actionUrl}" class="cta-button">View Trending Courses</a>
        </p>
        
        <p>Start your analysis to see detailed metrics and salary projections for ${courseName}!</p>
      </div>
      <div class="footer">
        <p>© 2026 AI-Driven Course Popularity Analyzer. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
    `.trim();
  }

  /**
   * Generate trending course alert email plain text
   */
  generateTrendingEmailText(data) {
    const { recipientName, courseName } = data;

    return `
Hi ${recipientName || 'there'},

Great news! ${courseName} has just entered the trending courses list!

This means:
- More job opportunities emerging
- Growing industry demand
- Excellent time to invest in learning this skill
- Potential for higher salaries

Check the trending courses page to see detailed metrics and salary projections.

© 2026 AI-Driven Course Popularity Analyzer
    `.trim();
  }

  /**
   * Get configuration status (useful for debugging)
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      provider: this.provider,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      message: this.isConfigured 
        ? '✓ Email service configured and ready'
        : '✗ Email service not properly configured'
    };
  }
}

// Export singleton instance
export default new EmailService();
