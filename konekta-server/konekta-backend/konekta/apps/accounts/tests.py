from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from apps.accounts.models import UserProfile, Block

TINY_GIF = b'GIF89a\x01\x00\x01\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'


User = get_user_model()


class SettingsFeaturesAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='alice',
            email='alice@example.com',
            password='OldPassword123!',
            first_name='Alice',
            last_name='Smith'
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        self.other_user = User.objects.create_user(
            username='bob',
            email='bob@example.com',
            password='Password123!',
            first_name='Bob',
            last_name='Jones'
        )
        UserProfile.objects.create(user=self.other_user)

    # 1. Password Change Tests
    def test_password_change_success(self):
        url = reverse('password-change')
        payload = {
            'old_password': 'OldPassword123!',
            'new_password': 'NewSecurePassword456!',
            'confirm_password': 'NewSecurePassword456!',
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecurePassword456!'))

    def test_password_change_invalid_old_password(self):
        url = reverse('password-change')
        payload = {
            'old_password': 'WrongOldPassword!',
            'new_password': 'NewSecurePassword456!',
            'confirm_password': 'NewSecurePassword456!',
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        errors = response.data.get('errors', response.data)
        self.assertIn('old_password', errors)

    def test_password_change_mismatched_new_passwords(self):
        url = reverse('password-change')
        payload = {
            'old_password': 'OldPassword123!',
            'new_password': 'NewSecurePassword456!',
            'confirm_password': 'DifferentPassword456!',
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_change_short_new_password(self):
        url = reverse('password-change')
        payload = {
            'old_password': 'OldPassword123!',
            'new_password': 'short',
            'confirm_password': 'short',
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 2. Notification Settings Tests
    def test_get_notification_settings_defaults(self):
        url = reverse('settings-notifications')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('email_notifications'))
        self.assertTrue(response.data.get('push_notifications'))

    def test_update_notification_settings(self):
        url = reverse('settings-notifications')
        payload = {
            'email_notifications': False,
            'push_notifications': True,
            'notify_follows': False,
            'notify_likes': True,
            'notify_comments': True,
            'notify_messages': False,
        }
        response = self.client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('email_notifications'))
        self.assertFalse(response.data.get('notify_follows'))
        
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.notification_settings.get('email_notifications'))

    # 3. Privacy Settings Tests
    def test_get_and_update_privacy_settings(self):
        url = reverse('settings-privacy')
        get_res = self.client.get(url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data.get('profile_visibility'), 'public')

        patch_res = self.client.patch(url, {'profile_visibility': 'private', 'search_visibility': False})
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data.get('profile_visibility'), 'private')
        self.assertFalse(patch_res.data.get('search_visibility'))

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.privacy_settings.get('profile_visibility'), 'private')

    # 4. Blocked Users Tests
    def test_block_and_unblock_user(self):
        block_url = reverse('block-toggle', kwargs={'user_id': self.other_user.id})
        list_url = reverse('blocked-list')

        # Block user
        res1 = self.client.post(block_url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(res1.data.get('blocked'))

        # List blocked users
        list_res = self.client.get(list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['blocked_user']['username'], 'bob')

        # Unblock user
        res2 = self.client.post(block_url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data.get('blocked'))

        list_res_after = self.client.get(list_url)
        results_after = list_res_after.data.get('results', list_res_after.data) if isinstance(list_res_after.data, dict) else list_res_after.data
        self.assertEqual(len(results_after), 0)

    # 5. Data Export Tests
    def test_data_export(self):
        url = reverse('export-data')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile', response.data)
        self.assertEqual(response.data['profile']['username'], 'alice')
        self.assertIn('posts', response.data)
        self.assertIn('comments', response.data)
        self.assertIn('likes', response.data)
        self.assertIn('groups', response.data)

    # 6. Delete Account Tests
    def test_delete_account_wrong_password(self):
        url = reverse('delete-account')
        response = self.client.post(url, {'password': 'WrongPassword123!'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(id=self.user.id).exists())

    def test_delete_account_correct_password(self):
        url = reverse('delete-account')
        response = self.client.post(url, {'password': 'OldPassword123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())


class ProfileMediaUploadAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='clara',
            email='clara@example.com',
            password='Password123!',
            first_name='Clara',
            last_name='Oswald'
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.url = reverse('user-profile')

    def test_get_profile_includes_media_fields(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_picture', response.data)
        self.assertIn('banner_image', response.data)

    def test_upload_profile_picture(self):
        avatar = SimpleUploadedFile('avatar.gif', TINY_GIF, content_type='image/gif')
        response = self.client.patch(self.url, {'profile_picture': avatar}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(bool(self.user.profile_picture))
        self.assertIsNotNone(response.data.get('profile_picture'))

    def test_upload_banner_image(self):
        banner = SimpleUploadedFile('banner.gif', TINY_GIF, content_type='image/gif')
        response = self.client.patch(self.url, {'banner_image': banner}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(bool(self.user.banner_image))
        self.assertIsNotNone(response.data.get('banner_image'))


class AuthAPITests(APITestCase):
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'first_name': 'Test',
            'last_name': 'User',
        }
        self.register_url = reverse('user-register')
        self.login_url = reverse('user-login')
        self.logout_url = reverse('user-logout')
        self.profile_url = reverse('user-profile')

    def test_register_success(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_register_duplicate_email(self):
        User.objects.create_user(
            username='existing',
            email='testuser@example.com',
            password='Password123!'
        )
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        payload = self.user_data.copy()
        payload['password_confirm'] = 'DifferentPassword123!'
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password(self):
        payload = self.user_data.copy()
        payload['password'] = 'short'
        payload['password_confirm'] = 'short'
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        user = User.objects.create_user(
            username='loginuser',
            email='login@example.com',
            password='SecretPassword123!'
        )
        response = self.client.post(self.login_url, {
            'username': 'loginuser',
            'password': 'SecretPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'loginuser')

    def test_login_invalid_credentials(self):
        User.objects.create_user(
            username='loginuser',
            email='login@example.com',
            password='SecretPassword123!'
        )
        response = self.client.post(self.login_url, {
            'username': 'loginuser',
            'password': 'WrongPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_success(self):
        user = User.objects.create_user(
            username='logoutuser',
            email='logout@example.com',
            password='Password123!'
        )
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_profile_requires_auth(self):
        # Without credentials
        response = self.client.get(self.profile_url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class FollowAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='Password123!')
        self.user2 = User.objects.create_user(username='user2', password='Password123!')
        self.token1, _ = Token.objects.get_or_create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

    def test_follow_user(self):
        url = reverse('follow-toggle', kwargs={'user_id': self.user2.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('following'))
        self.assertEqual(response.data.get('status'), 'followed')
        self.assertTrue(self.user1.following_set.filter(following=self.user2).exists())

    def test_unfollow_user(self):
        url = reverse('follow-toggle', kwargs={'user_id': self.user2.id})
        # Follow first
        self.client.post(url)
        # Toggle to unfollow
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('following'))
        self.assertEqual(response.data.get('status'), 'unfollowed')
        self.assertFalse(self.user1.following_set.filter(following=self.user2).exists())

    def test_follow_self_rejected(self):
        url = reverse('follow-toggle', kwargs={'user_id': self.user1.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_follow_status(self):
        status_url = reverse('follow-status', kwargs={'user_id': self.user2.id})
        res1 = self.client.get(status_url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertFalse(res1.data.get('is_following'))

        # Now follow
        self.client.post(reverse('follow-toggle', kwargs={'user_id': self.user2.id}))
        res2 = self.client.get(status_url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data.get('is_following'))

    def test_followers_and_following_lists(self):
        # user1 follows user2
        self.client.post(reverse('follow-toggle', kwargs={'user_id': self.user2.id}))

        # user1 checking following list
        following_res = self.client.get(reverse('following-list'))
        self.assertEqual(following_res.status_code, status.HTTP_200_OK)
        following_data = following_res.data.get('results', following_res.data) if isinstance(following_res.data, dict) else following_res.data
        self.assertEqual(len(following_data), 1)
        self.assertEqual(following_data[0]['username'], 'user2')

        # user2 checking followers list
        token2, _ = Token.objects.get_or_create(user=self.user2)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token2.key}')
        followers_res = self.client.get(reverse('followers-list'))
        self.assertEqual(followers_res.status_code, status.HTTP_200_OK)
        followers_data = followers_res.data.get('results', followers_res.data) if isinstance(followers_res.data, dict) else followers_res.data
        self.assertEqual(len(followers_data), 1)
        self.assertEqual(followers_data[0]['username'], 'user1')


class SearchAndReportAPITests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username='alice_wonders', password='Password123!')
        self.bob = User.objects.create_user(username='bob_builder', password='Password123!')
        self.token, _ = Token.objects.get_or_create(user=self.alice)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.search_url = reverse('search')
        self.report_url = reverse('report-create')

    def test_search_users_by_username(self):
        response = self.client.get(f'{self.search_url}?q=builder&type=users')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('users', response.data)
        self.assertEqual(len(response.data['users']), 1)
        self.assertEqual(response.data['users'][0]['username'], 'bob_builder')

    def test_search_all_types(self):
        response = self.client.get(f'{self.search_url}?q=bob&type=all')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('users', response.data)
        self.assertIn('groups', response.data)
        self.assertIn('posts', response.data)

    def test_search_empty_query(self):
        response = self.client.get(f'{self.search_url}?q=')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'users': [], 'groups': [], 'posts': []})

    def test_report_user(self):
        payload = {
            'reported_user': self.bob.id,
            'reason': 'harassment',
            'description': 'Sending inappropriate messages'
        }
        response = self.client.post(self.report_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['reason'], 'harassment')
        self.assertEqual(response.data['reported_user'], self.bob.id)

