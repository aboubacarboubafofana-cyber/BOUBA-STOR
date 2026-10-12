import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../models/monetization_model.dart';

class MonetizationService extends ChangeNotifier {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<String?> submitRequest({
    required String userId,
    required String nom,
    required String email,
    required String telephone,
    required String pays,
    required String moyenPaiement,
    required String numeroPaiement,
  }) async {
    try {
      final existing = await _db
          .collection('monetization_requests')
          .where('userId', isEqualTo: userId)
          .where('status', whereIn: ['pending', 'approved'])
          .get();

      if (existing.docs.isNotEmpty) {
        return 'Une demande existe déjà';
      }

      final req = MonetizationModel(
        id: '',
        userId: userId,
        nom: nom,
        email: email,
        telephone: telephone,
        pays: pays,
        moyenPaiement: moyenPaiement,
        numeroPaiement: numeroPaiement,
        createdAt: DateTime.now(),
      );

      await _db.collection('monetization_requests').add(req.toMap());
      notifyListeners();
      return null;
    } catch (e) {
      debugPrint('Erreur demande: $e');
      return e.toString();
    }
  }

  Future<MonetizationModel?> getMyRequest(String userId) async {
    final snap = await _db
        .collection('monetization_requests')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .limit(1)
        .get();

    if (snap.docs.isEmpty) return null;
    return MonetizationModel.fromMap(
        {...snap.docs.first.data(), 'id': snap.docs.first.id});
  }

  // Calcul des revenus : 1000 vues = 1 USD (exemple)
  double calculateEarnings(int views) {
    return (views / 1000) * 1.0;
  }
}