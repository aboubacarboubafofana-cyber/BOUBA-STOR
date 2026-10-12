class UserModel {
  final String uid;
  final String email;
  final String nom;
  final String telephone;
  final String pays;
  final String? photoUrl;
  final bool isMonetized;
  final double balance;
  final int followers;
  final int totalViews;
  final DateTime createdAt;

  UserModel({
    required this.uid,
    required this.email,
    required this.nom,
    required this.telephone,
    required this.pays,
    this.photoUrl,
    this.isMonetized = false,
    this.balance = 0.0,
    this.followers = 0,
    this.totalViews = 0,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() => {
        'uid': uid,
        'email': email,
        'nom': nom,
        'telephone': telephone,
        'pays': pays,
        'photoUrl': photoUrl,
        'isMonetized': isMonetized,
        'balance': balance,
        'followers': followers,
        'totalViews': totalViews,
        'createdAt': createdAt.toIso8601String(),
      };

  factory UserModel.fromMap(Map<String, dynamic> map) => UserModel(
        uid: map['uid'] ?? '',
        email: map['email'] ?? '',
        nom: map['nom'] ?? '',
        telephone: map['telephone'] ?? '',
        pays: map['pays'] ?? '',
        photoUrl: map['photoUrl'],
        isMonetized: map['isMonetized'] ?? false,
        balance: (map['balance'] ?? 0).toDouble(),
        followers: map['followers'] ?? 0,
        totalViews: map['totalViews'] ?? 0,
        createdAt: DateTime.parse(
            map['createdAt'] ?? DateTime.now().toIso8601String()),
      );
}