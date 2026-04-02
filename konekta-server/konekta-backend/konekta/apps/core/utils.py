from django.utils import timezone
from datetime import timedelta


def time_ago(dt):
    """Return a human-readable time ago string."""
    now = timezone.now()
    diff = now - dt

    if diff < timedelta(minutes=1):
        return "just now"
    elif diff < timedelta(hours=1):
        mins = int(diff.total_seconds() / 60)
        return f"{mins}m ago"
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f"{hours}h ago"
    elif diff < timedelta(days=7):
        days = diff.days
        return f"{days}d ago"
    elif diff < timedelta(days=30):
        weeks = diff.days // 7
        return f"{weeks}w ago"
    else:
        return dt.strftime("%b %d, %Y")
