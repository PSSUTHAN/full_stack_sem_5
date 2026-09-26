from django.urls import path
from .views import ChatView, ClearChatView, RegenerateEmbeddingsView

urlpatterns = [
    path('chat', ChatView.as_view(), name='chat'),
    path('chat/', ChatView.as_view(), name='chat-slash'),
    path('api/chat', ChatView.as_view(), name='api-chat'),
    path('api/chat/', ChatView.as_view(), name='api-chat-slash'),
    path('clear', ClearChatView.as_view(), name='chat-clear'),
    path('clear/', ClearChatView.as_view(), name='chat-clear-slash'),
    path('api/clear', ClearChatView.as_view(), name='api-chat-clear'),
    path('regenerate-embeddings', RegenerateEmbeddingsView.as_view(), name='regenerate-embeddings'),
]
