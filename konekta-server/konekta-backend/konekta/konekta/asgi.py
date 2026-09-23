"""
ASGI config for konekta project with Django Channels.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'konekta.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from apps.core.channels_middleware import TokenAuthMiddlewareStack
import apps.messaging.routing
import apps.notifications.routing

websocket_urlpatterns = (
    apps.messaging.routing.websocket_urlpatterns +
    apps.notifications.routing.websocket_urlpatterns
)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
