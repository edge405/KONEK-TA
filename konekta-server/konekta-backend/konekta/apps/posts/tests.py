from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from apps.accounts.models import Block
from apps.posts.models import Post, Comment

User = get_user_model()


class PostFilteringAPITests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username='alice', password='Password123!')
        self.bob = User.objects.create_user(username='bob', password='Password123!')
        self.charlie = User.objects.create_user(username='charlie', password='Password123!')

        self.alice_post = Post.objects.create(author=self.alice, content="Alice's post", visibility='public')
        self.bob_post = Post.objects.create(author=self.bob, content="Bob's post", visibility='public')
        self.charlie_post = Post.objects.create(author=self.charlie, content="Charlie's post", visibility='public')

        self.bob_token, _ = Token.objects.get_or_create(user=self.bob)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.bob_token.key}')
        self.feed_url = reverse('post-list')

    def test_feed_hides_not_interested_post(self):
        # Initially all 3 posts are visible
        res1 = self.client.get(self.feed_url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        results1 = res1.data.get('results', res1.data) if isinstance(res1.data, dict) else res1.data
        post_ids1 = [p['id'] for p in results1]
        self.assertIn(self.alice_post.id, post_ids1)

        # Bob marks Alice's post as not interested
        hide_url = reverse('post-hide', kwargs={'post_id': self.alice_post.id})
        hide_res = self.client.post(hide_url, {'reason': 'not_interested'})
        self.assertEqual(hide_res.status_code, status.HTTP_200_OK)

        # Alice's post is now excluded from Bob's feed
        res2 = self.client.get(self.feed_url)
        results2 = res2.data.get('results', res2.data) if isinstance(res2.data, dict) else res2.data
        post_ids2 = [p['id'] for p in results2]
        self.assertNotIn(self.alice_post.id, post_ids2)
        self.assertIn(self.bob_post.id, post_ids2)
        self.assertIn(self.charlie_post.id, post_ids2)

    def test_unhide_post(self):
        hide_url = reverse('post-hide', kwargs={'post_id': self.alice_post.id})
        self.client.post(hide_url, {'reason': 'not_interested'})

        # Unhide Alice's post
        unhide_res = self.client.delete(hide_url)
        self.assertEqual(unhide_res.status_code, status.HTTP_200_OK)

        # Post is visible again
        res = self.client.get(self.feed_url)
        results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        post_ids = [p['id'] for p in results]
        self.assertIn(self.alice_post.id, post_ids)

    def test_feed_excludes_blocked_users(self):
        # Bob blocks Charlie
        Block.objects.create(blocker=self.bob, blocked=self.charlie)

        res = self.client.get(self.feed_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        post_ids = [p['id'] for p in results]
        self.assertNotIn(self.charlie_post.id, post_ids)
        self.assertIn(self.bob_post.id, post_ids)


class PostCRUDAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='john', password='Password123!')
        self.other_user = User.objects.create_user(username='jane', password='Password123!')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.post = Post.objects.create(author=self.user, content="Original content", visibility='public')
        self.list_url = reverse('post-list')
        self.detail_url = reverse('post-detail', kwargs={'pk': self.post.id})

    def test_create_post(self):
        payload = {'content': 'Hello world!', 'visibility': 'public'}
        response = self.client.post(self.list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Hello world!')
        self.assertTrue(Post.objects.filter(content='Hello world!').exists())

    def test_list_posts(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertTrue(len(results) >= 1)

    def test_get_post_detail(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Original content')

    def test_update_own_post(self):
        payload = {'content': 'Updated content'}
        response = self.client.patch(self.detail_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertEqual(self.post.content, 'Updated content')

    def test_delete_own_post(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(id=self.post.id).exists())

    def test_cannot_edit_other_user_post(self):
        other_token, _ = Token.objects.get_or_create(user=self.other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {other_token.key}')
        response = self.client.patch(self.detail_url, {'content': 'Hacked content'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PostInteractionsAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='Password123!')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.post = Post.objects.create(author=self.user, content="Awesome post", visibility='public')
        self.like_url = reverse('post-like', kwargs={'post_id': self.post.id})
        self.comment_url = reverse('comment-list', kwargs={'post_id': self.post.id})
        self.share_url = reverse('post-share', kwargs={'post_id': self.post.id})

    def test_like_post(self):
        response = self.client.post(self.like_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), 'Post liked')
        self.post.refresh_from_db()
        self.assertEqual(self.post.likes_count, 1)

    def test_unlike_post(self):
        # Like first
        self.client.post(self.like_url)
        # Unlike
        response = self.client.post(self.like_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), 'Post unliked')
        self.post.refresh_from_db()
        self.assertEqual(self.post.likes_count, 0)

    def test_comment_on_post(self):
        payload = {'content': 'Great post!'}
        response = self.client.post(self.comment_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Great post!')
        self.assertTrue(Comment.objects.filter(post=self.post, content='Great post!').exists())

    def test_list_comments(self):
        Comment.objects.create(user=self.user, post=self.post, content='First comment')
        response = self.client.get(self.comment_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['content'], 'First comment')

    def test_share_post(self):
        response = self.client.post(self.share_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertEqual(self.post.shares_count, 1)


class PostFilteringParamsTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='filter_user1', password='Password123!')
        self.user2 = User.objects.create_user(username='filter_user2', password='Password123!')
        self.token1, _ = Token.objects.get_or_create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

        from apps.groups.models import Group
        self.group = Group.objects.create(name='Filter Group', admin=self.user1, is_private=False)

        self.post1 = Post.objects.create(author=self.user1, content="User1 general post", visibility='public')
        self.post2 = Post.objects.create(author=self.user2, content="User2 general post", visibility='public')
        self.post3 = Post.objects.create(author=self.user1, group=self.group, content="User1 group post", visibility='public')

    def test_filter_posts_by_author(self):
        url = f"{reverse('post-list')}?author={self.user2.id}"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        post_ids = [p['id'] for p in results]
        self.assertIn(self.post2.id, post_ids)
        self.assertNotIn(self.post1.id, post_ids)

    def test_filter_posts_by_group(self):
        url = f"{reverse('post-list')}?group={self.group.id}"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        post_ids = [p['id'] for p in results]
        self.assertIn(self.post3.id, post_ids)
        self.assertNotIn(self.post1.id, post_ids)

    def test_post_serializer_includes_author_object(self):
        url = reverse('post-detail', kwargs={'pk': self.post1.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data['author'], dict)
        self.assertEqual(res.data['author']['id'], self.user1.id)
        self.assertEqual(res.data['author']['username'], self.user1.username)

    def test_direct_search_endpoint(self):
        # Test GET /api/search/?q=User1
        res = self.client.get('/api/search/?q=User1')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('posts', res.data)
        self.assertTrue(len(res.data['posts']) >= 1)


class PostBookmarkAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='bookmarker', password='Password123!')
        self.other_user = User.objects.create_user(username='post_author', password='Password123!')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.post = Post.objects.create(author=self.other_user, content="Bookmark me!", visibility='public')
        self.bookmark_url = reverse('post-bookmark', kwargs={'post_id': self.post.id})
        self.bookmarks_list_url = reverse('bookmark-list')

    def test_bookmark_post(self):
        # Bookmark post
        res = self.client.post(self.bookmark_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get('bookmarked'))

        # Check bookmark list
        list_res = self.client.get(self.bookmarks_list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.post.id)
        self.assertTrue(results[0]['is_bookmarked'])

    def test_unbookmark_post(self):
        # Bookmark
        self.client.post(self.bookmark_url)
        # Unbookmark
        res = self.client.post(self.bookmark_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data.get('bookmarked'))

        # Check bookmark list is empty
        list_res = self.client.get(self.bookmarks_list_url)
        results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
        self.assertEqual(len(results), 0)

    def test_bookmark_nonexistent_post(self):
        url = reverse('post-bookmark', kwargs={'post_id': 999999})
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class CommentManagementAPITests(APITestCase):
    def setUp(self):
        self.post_author = User.objects.create_user(username='author', password='Password123!')
        self.commenter = User.objects.create_user(username='commenter', password='Password123!')
        self.random_user = User.objects.create_user(username='random', password='Password123!')

        self.post = Post.objects.create(author=self.post_author, content="Discussion post", visibility='public')

        self.commenter_token, _ = Token.objects.get_or_create(user=self.commenter)
        self.post_author_token, _ = Token.objects.get_or_create(user=self.post_author)
        self.random_token, _ = Token.objects.get_or_create(user=self.random_user)

    def test_add_comment_increments_comments_count(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.commenter_token.key}')
        url = reverse('comment-list', kwargs={'post_id': self.post.id})
        res = self.client.post(url, {'content': 'Nice post!'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.post.refresh_from_db()
        self.assertEqual(self.post.comments_count, 1)

    def test_author_can_delete_own_comment_and_decrements_count(self):
        # Create comment
        comment = Comment.objects.create(user=self.commenter, post=self.post, content="My comment")
        self.post.comments_count = 1
        self.post.save()

        # Delete comment as commenter
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.commenter_token.key}')
        delete_url = reverse('comment-detail', kwargs={'pk': comment.id})
        res = self.client.delete(delete_url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(Comment.objects.filter(id=comment.id).exists())
        self.post.refresh_from_db()
        self.assertEqual(self.post.comments_count, 0)

    def test_post_author_can_delete_any_comment_on_their_post(self):
        comment = Comment.objects.create(user=self.commenter, post=self.post, content="Spam comment")
        self.post.comments_count = 1
        self.post.save()

        # Delete comment as post author
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.post_author_token.key}')
        delete_url = reverse('comment-detail', kwargs={'pk': comment.id})
        res = self.client.delete(delete_url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(Comment.objects.filter(id=comment.id).exists())

    def test_unauthorized_user_cannot_delete_other_comment(self):
        comment = Comment.objects.create(user=self.commenter, post=self.post, content="Legit comment")

        # Try to delete as random user
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.random_token.key}')
        delete_url = reverse('comment-detail', kwargs={'pk': comment.id})
        res = self.client.delete(delete_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Comment.objects.filter(id=comment.id).exists())

