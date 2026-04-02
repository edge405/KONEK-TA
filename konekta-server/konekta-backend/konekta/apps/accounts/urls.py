from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('login/', views.login_view, name='user-login'),
    path('logout/', views.logout_view, name='user-logout'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('follow/<int:user_id>/', views.follow_toggle_view, name='follow-toggle'),
    path('follow/<int:user_id>/status/', views.follow_status_view, name='follow-status'),
    path('followers/', views.FollowersListView.as_view(), name='followers-list'),
    path('following/', views.FollowingListView.as_view(), name='following-list'),
    path('block/<int:user_id>/', views.block_toggle_view, name='block-toggle'),
    path('blocked/', views.BlockedUsersView.as_view(), name='blocked-list'),
    path('report/', views.ReportCreateView.as_view(), name='report-create'),
    path('search/', views.search_view, name='search'),
]
