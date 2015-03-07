'use strict';

app.factory('Post',
  function($firebase, FIREBASE_URL, User) {
    var ref = new Firebase(FIREBASE_URL + 'posts');
    var posts = $firebase(ref);

    var Post = {
      all: posts,
      create: function (post) {
        if (User.signedIn()) {
          var user = User.getCurrent();

          post.owner = user.username;

          return posts.$add(post).then(function (ref) {
            var postId = ref.name();

            user.$child('posts').$child(postId).$set(postId);

            return postId;
          });
        }
      },
      find: function (postId) {
        return posts.$child(postId);
      },
      delete: function (postId) {
        if (User.signedIn()) {
          var post = Post.find(postId);

          post.$on('loaded', function () {
            var user = User.findByUsername(post.owner);

            posts.$remove(postId).then(function () {
              user.$child('posts').$remove(postId);
            });
          });
        }
      },
      addComment: function (postId, comment) {
        if (User.signedIn()) {
          var user = User.getCurrent();

          comment.username = user.username;
          comment.postId = postId;

          posts.$child(postId).$child('comments').$add(comment).then(function (ref) {
            user.$child('comments').$child(ref.name()).$set({id: ref.name(), postId: postId});
          });
        }
      },
      deleteComment: function (post, comment, commentId) {
        if (User.signedIn()) {
          var user = User.findByUsername(comment.username);

          post.$child('comments').$remove(commentId).then(function () {
            user.$child('comments').$remove(commentId);
          });
        }
      },
      upVote: function (postId) {
        if (User.signedIn()) {
          var user = User.getCurrent();
          var post = posts.$child(postId);
  
          post.$child('upvotes').$child(user.username).$set(user.username).then(function () {
            user.$child('upvotes').$child(postId).$set(postId);
            post.$child('downvotes').$remove(user.username);
            user.$child('downvotes').$remove(postId);
  
            post.$child('score').$transaction(function (score) {
              if (!score) {
                return 1;
              }
  
              return score + 1;
            });
          });
        }
      },
      downVote: function (postId) {
        if (User.signedIn()) {
          var user = User.getCurrent();
          var post = posts.$child(postId);
  
          post.$child('downvotes').$child(user.username).$set(user.username).then(function () {
            user.$child('downvotes').$child(postId).$set(postId);
            post.$child('upvotes').$remove(user.username);
            user.$child('upvotes').$remove(postId);
  
            post.$child('score').$transaction(function (score) {
              if (score === undefined || score === null) {
                return -1;
              }
  
              return score - 1;
            });
          });
        }
      },
      clearVote: function (postId, upVoted) {
        if (User.signedIn()) {
          var user = User.getCurrent();
          var username = user.username;
          var post = posts.$child(postId);
  
          post.$child('upvotes').$remove(username);
          post.$child('downvotes').$remove(username);
          user.$child('upvotes').$remove(postId);
          user.$child('downvotes').$remove(postId);
          post.$child('score').$transaction(function (score) {
            if (upVoted) {
              return score - 1;
            } else {
              return score + 1;
            }
          });
        }
      },
      upVoted: function (post) {
        if (User.signedIn && post.upvotes) {
          return post.upvotes.hasOwnProperty(User.getCurrent().username);
        }
      },
      downVoted: function (post) {
        if (User.signedIn && post.downvotes) {
          return post.downvotes.hasOwnProperty(User.getCurrent().username);
        }
      }
    };

    return Post;
  }
);
