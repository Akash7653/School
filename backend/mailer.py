import os
import smtplib
from email.message import EmailMessage
import logging

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get('SMTP_HOST')
SMTP_PORT = int(os.environ.get('SMTP_PORT') or 0)
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASS = os.environ.get('SMTP_PASS')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'no-reply@example.com')
ADMIN_NOTIFICATION_EMAILS = os.environ.get('ADMIN_NOTIFICATION_EMAILS', '')


def send_email(to: str, subject: str, body: str):
    """Send an email synchronously. If SMTP is not configured, log the message instead."""
    if not SMTP_HOST or not SMTP_PORT or not SMTP_USER or not SMTP_PASS:
        logger.info("SMTP not configured - email not sent. Subject: %s, To: %s", subject, to)
        logger.debug("Email body:\n%s", body)
        return False

    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to
        msg.set_content(body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.exception('Failed to send email: %s', e)
        return False


def notify_admins_of_new_registration(user):
    if not ADMIN_NOTIFICATION_EMAILS:
        logger.info('No admin notification email configured; skipping admin notify for user %s', user.get('email'))
        return

    subject = f"New registration: {user.get('name')} ({user.get('role')})"
    body = (
        f"A new user has registered and requires approval:\n\n"
        f"Name: {user.get('name')}\n"
        f"Email: {user.get('email')}\n"
        f"Role: {user.get('role')}\n"
        f"User ID: {user.get('user_id')}\n\n"
        "Visit the admin panel to approve or reject this user."
    )

    for addr in ADMIN_NOTIFICATION_EMAILS.split(','):
        addr = addr.strip()
        if addr:
            send_email(addr, subject, body)


def notify_user_on_approval(email: str):
    subject = 'Your account has been approved'
    body = 'Your account has been approved by the admin. You can now login to the system.'
    send_email(email, subject, body)


def notify_user_on_rejection(email: str):
    subject = 'Your registration was rejected'
    body = 'Your registration was rejected by the admin. If you believe this is a mistake, contact the school admin.'
    send_email(email, subject, body)
