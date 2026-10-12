class PublicationModel {
  final String id;
  final String authorId;
  final String authorName;
  final String? authorPhoto;
  final String type; // story, video, photo
  final String mediaUrl;
  final String? thumbnailUrl;
  final String caption;
  final int likes;
  final int views;
  final int comments;
  final DateTime createdAt;
  final DateTime? expiresAt; // pour stories

  PublicationModel({
    required this.id,
    required this.authorId,
    required this.authorName,
    this.authorPhoto,
    required this.type,
    required this.mediaUrl,
    this.thumbnailUrl,
    this.caption = '',
    this.likes = 0,
    this.views = 0,
    this.comments = 0,
    required this.createdAt,
    this.expiresAt,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'authorId': authorId,
        'authorName': authorName,
        'authorPhoto': authorPhoto,
        'type': type,
        'mediaUrl': mediaUrl,
        'thumbnailUrl': thumbnailUrl,
        'caption': caption,
        'likes': likes,
        'views': views,
        'comments': comments,
        'createdAt': createdAt.toIso8601String(),
        'expiresAt': expiresAt?.toIso8601String(),
      };

  factory PublicationModel.fromMap(Map<String, dynamic> map) =>
      PublicationModel(
        id: map['id'] ?? '',
        authorId: map['authorId'] ?? '',
        authorName: map['authorName'] ?? '',
        authorPhoto: map['authorPhoto'],
        type: map['type'] ?? 'photo',
        mediaUrl: map['mediaUrl'] ?? '',
        thumbnailUrl: map['thumbnailUrl'],
        caption: map['caption'] ?? '',
        likes: map['likes'] ?? 0,
        views: map['views'] ?? 0,
        comments: map['comments'] ?? 0,
        createdAt: DateTime.parse(
            map['createdAt'] ?? DateTime.now().toIso8601String()),
        expiresAt: map['expiresAt'] != null
            ? DateTime.parse(map['expiresAt'])
            : null,
      );
}