from django.urls import path
from . import views

urlpatterns = [
    path('', views.GroupListView.as_view(), name='group-list'),
    path('<int:pk>/', views.GroupDetailView.as_view(), name='group-detail'),
    path('<int:group_id>/join/', views.GroupJoinView.as_view(), name='group-join'),
    path('<int:group_id>/leave/', views.GroupLeaveView.as_view(), name='group-leave'),
    path('<int:group_id>/members/', views.GroupMembersView.as_view(), name='group-members'),
    path('invitations/', views.GroupInvitationView.as_view(), name='group-invitations'),
    path('invitations/<int:invitation_id>/accept/', views.accept_invitation, name='accept-invitation'),
]
