class MonetizationModel {
  final String id;
  final String userId;
  final String nom;
  final String email;
  final String telephone;
  final String pays;
  final String moyenPaiement; // Wave, Orange Money
  final String numeroPaiement;
  final String status; // pending, approved, rejected
  final DateTime createdAt;
  final DateTime? approvedAt;
  final double totalEarnings;

  MonetizationModel({
    required this.id,
    required this.userId,
    required this.nom,
    required this.email,
    required this.telephone,
    required this.pays,
    required this.moyenPaiement,
    required this.numeroPaiement,
    this.status = 'pending',
    required this.createdAt,
    this.approvedAt,
    this.totalEarnings = 0,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'userId': userId,
        'nom': nom,
        'email': email,
        'telephone': telephone,
        'pays': pays,
        'moyenPaiement': moyenPaiement,
        'numeroPaiement': numeroPaiement,
        'status': status,
        'createdAt': createdAt.toIso8601String(),
        'approvedAt': approvedAt?.toIso8601String(),
        'totalEarnings': totalEarnings,
      };

  factory MonetizationModel.fromMap(Map<String, dynamic> map) =>
      MonetizationModel(
        id: map['id'] ?? '',
        userId: map['userId'] ?? '',
        nom: map['nom'] ?? '',
        email: map['email'] ?? '',
        telephone: map['telephone'] ?? '',
        pays: map['pays'] ?? '',
        moyenPaiement: map['moyenPaiement'] ?? '',
        numeroPaiement: map['numeroPaiement'] ?? '',
        status: map['status'] ?? 'pending',
        createdAt: DateTime.parse(
            map['createdAt'] ?? DateTime.now().toIso8601String()),
        approvedAt: map['approvedAt'] != null
            ? DateTime.parse(map['approvedAt'])
            : null,
        totalEarnings: (map['totalEarnings'] ?? 0).toDouble(),
      );
}