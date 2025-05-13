import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import logger from '../config/logger.js';
import { alertThresholds } from '../config/monitoring.js';

class AlertService {
    constructor() {
        // Initialize email transport
        this.emailTransport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Initialize Slack client
        this.slackClient = new WebClient(process.env.SLACK_TOKEN);
    }

    async sendAlert(type, level, details) {
        try {
            const alertMessage = this.formatAlertMessage(type, level, details);

            // Log alert
            logger.warn('Alert triggered:', { type, level, details });

            // Send notifications
            await Promise.all([
                this.sendEmailAlert(alertMessage),
                this.sendSlackAlert(alertMessage)
            ]);

        } catch (error) {
            logger.error('Error sending alert:', error);
        }
    }

    formatAlertMessage(type, level, details) {
        const timestamp = new Date().toISOString();
        return {
            subject: `[${level.toUpperCase()}] ${type} Alert - Influencers Dashboard`,
            body: `
Alert Details:
- Type: ${type}
- Level: ${level}
- Timestamp: ${timestamp}
- Details: ${JSON.stringify(details, null, 2)}
      `.trim()
        };
    }

    async sendEmailAlert(message) {
        try {
            await this.emailTransport.sendMail({
                from: process.env.ALERT_EMAIL_FROM,
                to: process.env.ALERT_EMAIL_TO,
                subject: message.subject,
                text: message.body
            });
        } catch (error) {
            logger.error('Error sending email alert:', error);
        }
    }

    async sendSlackAlert(message) {
        try {
            await this.slackClient.chat.postMessage({
                channel: process.env.SLACK_ALERT_CHANNEL,
                text: message.subject,
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: message.subject
                        }
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: '```' + message.body + '```'
                        }
                    }
                ]
            });
        } catch (error) {
            logger.error('Error sending Slack alert:', error);
        }
    }

    // Alert check functions
    checkApiLatency(endpoint, duration) {
        const thresholds = alertThresholds.api.latency;

        if (duration >= thresholds.critical) {
            this.sendAlert('API Latency', 'critical', { endpoint, duration });
        } else if (duration >= thresholds.warning) {
            this.sendAlert('API Latency', 'warning', { endpoint, duration });
        }
    }

    checkErrorRate(errorCount, totalRequests) {
        const errorRate = errorCount / totalRequests;
        const thresholds = alertThresholds.api.errorRate;

        if (errorRate >= thresholds.critical) {
            this.sendAlert('Error Rate', 'critical', { errorRate, errorCount, totalRequests });
        } else if (errorRate >= thresholds.warning) {
            this.sendAlert('Error Rate', 'warning', { errorRate, errorCount, totalRequests });
        }
    }

    checkMemoryUsage(heapUsed, heapTotal) {
        const heapUsage = heapUsed / heapTotal;
        const thresholds = alertThresholds.memory.heapUsage;

        if (heapUsage >= thresholds.critical) {
            this.sendAlert('Memory Usage', 'critical', { heapUsage, heapUsed, heapTotal });
        } else if (heapUsage >= thresholds.warning) {
            this.sendAlert('Memory Usage', 'warning', { heapUsage, heapUsed, heapTotal });
        }
    }

    checkDbQueryTime(operation, collection, duration) {
        const thresholds = alertThresholds.database.queryTime;

        if (duration >= thresholds.critical) {
            this.sendAlert('Database Query Time', 'critical', { operation, collection, duration });
        } else if (duration >= thresholds.warning) {
            this.sendAlert('Database Query Time', 'warning', { operation, collection, duration });
        }
    }
}

export const alertService = new AlertService();
export default alertService;