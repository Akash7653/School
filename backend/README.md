# Backend local notes

- Tests: to run tests locally:
  - `pip install -r requirements.txt`
  - `pip install pytest pytest-asyncio httpx`
  - `pytest backend/tests/test_auth_approval.py -q`

- Email: add SMTP credentials to `.env` (see `.env.example`) to enable real mail sending. If SMTP is not configured the system logs the email message instead of sending.
