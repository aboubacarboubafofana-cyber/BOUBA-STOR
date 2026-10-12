import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  static const String adminWhatsApp = '2250787619717';

  /// Demande de retrait
  Future<void> requestWithdrawal({
    required String userId,
    required String nom,
    required double montant,
    required String moyen,
    required String numero,
  }) async {
    await _db.collection('withdrawal_requests').add({
      'userId': userId,
      'nom': nom,
      'montant': montant,
      'moyen': moyen, // Wave / Orange Money
      'numero': numero,
      'status': 'pending',
      'createdAt': DateTime.now().toIso8601String(),
    });

    // Notifier l'admin via WhatsApp
    final msg = Uri.encodeComponent(
      '💰 DEMANDE DE RETRAIT\n'
      'Nom: $nom\n'
      'Montant: $montant USD\n'
      'Moyen: $moyen\n'
      'Numéro: $numero\n'
      'UserID: $userId',
    );

    final url = Uri.parse('https://wa.me/$adminWhatsApp?text=$msg');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  /// Envoyer la demande de monétisation initiale via WhatsApp
  Future<void> sendMonetizationRequest({
    required String nom,
    required String email,
    required String telephone,
    required String pays,
    required String moyen,
    required String numero,
  }) async {
    final msg = Uri.encodeComponent(
      '🎬 DEMANDE DE MONÉTISATION\n\n'
      '👤 Nom: $nom\n'
      '📧 Email: $email\n'
      '📱 Téléphone: $telephone\n'
      '🌍 Pays: $pays\n'
      '💰 Paiement: $moyen\n'
      '🔢 Numéro: $numero\n\n'
      'Merci d\'activer ma monétisation.',
    );

    final url = Uri.parse('https://wa.me/$adminWhatsApp?text=$msg');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }
}