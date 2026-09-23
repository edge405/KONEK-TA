from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from apps.groups.models import Group, GroupMembership, GroupInvitation

User = get_user_model()


class GroupCRUDAPITests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(username='group_admin', password='Password123!')
        self.regular_user = User.objects.create_user(username='regular_member', password='Password123!')
        self.admin_token, _ = Token.objects.get_or_create(user=self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        
        self.group = Group.objects.create(
            name='Tech Innovators',
            description='A group for innovators',
            admin=self.admin_user,
            is_private=False
        )
        GroupMembership.objects.create(user=self.admin_user, group=self.group, role='admin')
        self.list_url = reverse('group-list')
        self.detail_url = reverse('group-detail', kwargs={'pk': self.group.id})

    def test_create_group(self):
        payload = {
            'name': 'Designers Hub',
            'description': 'Creative minds unite',
            'is_private': False
        }
        response = self.client.post(self.list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Designers Hub')
        created_group = Group.objects.get(name='Designers Hub')
        self.assertEqual(created_group.admin, self.admin_user)
        self.assertTrue(GroupMembership.objects.filter(user=self.admin_user, group=created_group, role='admin').exists())

    def test_list_groups(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertTrue(len(results) >= 1)

    def test_get_group_detail(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Tech Innovators')

    def test_update_group_as_admin(self):
        response = self.client.patch(self.detail_url, {'description': 'Updated description'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group.refresh_from_db()
        self.assertEqual(self.group.description, 'Updated description')

    def test_delete_group_as_admin(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Group.objects.filter(id=self.group.id).exists())

    def test_non_admin_cannot_update(self):
        reg_token, _ = Token.objects.get_or_create(user=self.regular_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {reg_token.key}')
        response = self.client.patch(self.detail_url, {'name': 'Hacked Group'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupMembershipAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin_alice', password='Password123!')
        self.member = User.objects.create_user(username='member_bob', password='Password123!')
        self.member_token, _ = Token.objects.get_or_create(user=self.member)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.member_token.key}')

        self.public_group = Group.objects.create(
            name='Open Club',
            description='Everyone is welcome',
            admin=self.admin,
            is_private=False
        )
        GroupMembership.objects.create(user=self.admin, group=self.public_group, role='admin')

        self.private_group = Group.objects.create(
            name='Secret Society',
            description='Invite only',
            admin=self.admin,
            is_private=True
        )
        GroupMembership.objects.create(user=self.admin, group=self.private_group, role='admin')

    def test_join_public_group(self):
        url = reverse('group-join', kwargs={'group_id': self.public_group.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), 'Successfully joined the group')
        self.assertTrue(GroupMembership.objects.filter(user=self.member, group=self.public_group).exists())

    def test_cannot_join_private_group(self):
        url = reverse('group-join', kwargs={'group_id': self.private_group.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(GroupMembership.objects.filter(user=self.member, group=self.private_group).exists())

    def test_leave_group(self):
        # Join public group first
        GroupMembership.objects.create(user=self.member, group=self.public_group, role='member')
        self.public_group.members_count = 1
        self.public_group.save()

        url = reverse('group-leave', kwargs={'group_id': self.public_group.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), 'Successfully left the group')
        self.assertFalse(GroupMembership.objects.filter(user=self.member, group=self.public_group).exists())

    def test_admin_cannot_leave_group(self):
        admin_token, _ = Token.objects.get_or_create(user=self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token.key}')
        url = reverse('group-leave', kwargs={'group_id': self.public_group.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_group_members(self):
        url = reverse('group-members', kwargs={'group_id': self.public_group.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertTrue(len(results) >= 1)
        self.assertIn('user_details', results[0])
        self.assertEqual(results[0]['user_details']['username'], self.admin.username)

    def test_search_groups(self):
        url = reverse('group-list')
        response = self.client.get(f'{url}?search=Open')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Open Club')


class GroupInvitationAPITests(APITestCase):
    def setUp(self):
        self.inviter = User.objects.create_user(username='inviter_sam', password='Password123!')
        self.invitee = User.objects.create_user(username='invitee_pat', password='Password123!')
        self.invitee_token, _ = Token.objects.get_or_create(user=self.invitee)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.invitee_token.key}')

        self.group = Group.objects.create(
            name='Exclusive Club',
            description='VIPs only',
            admin=self.inviter,
            is_private=True
        )
        GroupMembership.objects.create(user=self.inviter, group=self.group, role='admin')

        self.invitation = GroupInvitation.objects.create(
            group=self.group,
            inviter=self.inviter,
            invitee=self.invitee,
            status='pending',
            message='Join us!'
        )

    def test_list_invitations(self):
        url = reverse('group-invitations')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.invitation.id)

    def test_accept_invitation(self):
        url = reverse('accept-invitation', kwargs={'invitation_id': self.invitation.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invitation.refresh_from_db()
        self.assertEqual(self.invitation.status, 'accepted')
        self.assertTrue(GroupMembership.objects.filter(user=self.invitee, group=self.group).exists())

    def test_accept_already_processed_invitation(self):
        self.invitation.status = 'accepted'
        self.invitation.save()
        url = reverse('accept-invitation', kwargs={'invitation_id': self.invitation.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GroupPostsAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='gp_admin', password='Password123!')
        self.member = User.objects.create_user(username='gp_member', password='Password123!')
        self.outsider = User.objects.create_user(username='gp_outsider', password='Password123!')
        self.admin_token, _ = Token.objects.get_or_create(user=self.admin)
        self.member_token, _ = Token.objects.get_or_create(user=self.member)
        self.outsider_token, _ = Token.objects.get_or_create(user=self.outsider)

        self.public_group = Group.objects.create(
            name='Public Club',
            description='Open to all',
            admin=self.admin,
            is_private=False
        )
        GroupMembership.objects.create(user=self.admin, group=self.public_group, role='admin')
        GroupMembership.objects.create(user=self.member, group=self.public_group, role='member')

        self.private_group = Group.objects.create(
            name='Secret Club',
            description='Members only',
            admin=self.admin,
            is_private=True
        )
        GroupMembership.objects.create(user=self.admin, group=self.private_group, role='admin')

    def test_create_and_list_group_posts(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.member_token.key}')
        url = reverse('group-posts', kwargs={'group_id': self.public_group.id})
        
        # Post in group
        res = self.client.post(url, {'content': 'Hello Club!'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['content'], 'Hello Club!')

        # List posts in group
        list_res = self.client.get(url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['content'], 'Hello Club!')

    def test_non_member_cannot_post_in_group(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.outsider_token.key}')
        url = reverse('group-posts', kwargs={'group_id': self.public_group.id})
        res = self.client.post(url, {'content': 'Intruder message'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_private_group_posts_hidden_from_non_members(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.outsider_token.key}')
        url = reverse('group-posts', kwargs={'group_id': self.private_group.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

