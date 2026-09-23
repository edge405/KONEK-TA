from django.urls import path
from . import views

urlpatterns = [
    path('', views.PostListView.as_view(), name='post-list'),
    path('bookmarks/', views.BookmarkListView.as_view(), name='bookmark-list'),
    path('<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    path('<int:post_id>/like/', views.PostLikeView.as_view(), name='post-like'),
    path('<int:post_id>/bookmark/', views.PostBookmarkView.as_view(), name='post-bookmark'),
    path('<int:post_id>/comments/', views.CommentListView.as_view(), name='comment-list'),
    path('<int:post_id>/share/', views.PostShareView.as_view(), name='post-share'),
    path('<int:post_id>/hide/', views.PostHideView.as_view(), name='post-hide'),
]

