import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/publication_model.dart';

class PublicationService extends ChangeNotifier {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final ImagePicker _picker = ImagePicker();

  // Récupérer les publications par type
  Stream<List<PublicationModel>> getPublications(String type) {
    Query query = _db
        .collection('publications')
        .where('type', isEqualTo: type)
        .orderBy('createdAt', descending: true)
        .limit(50);

    if (type == 'story') {
      query = query.where('expiresAt',
          isGreaterThan: DateTime.now().toIso8601String());
    }

    return query.snapshots().map((snap) => snap.docs
        .map((doc) => PublicationModel.fromMap(
            {...doc.data() as Map<String, dynamic>, 'id': doc.id}))
        .toList());
  }

  // Publier
  Future<PublicationModel?> publish({
    required String authorId,
    required String authorName,
    String? authorPhoto,
    required String type,
    required XFile media,
    String caption = '',
  }) async {
    try {
      // Upload vers Firebase Storage
      final file = File(media.path);
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_${media.name}';
      final ref = _storage.ref().child('publications/$authorId/$fileName');
      await ref.putFile(file);
      final url = await ref.getDownloadURL();

      final now = DateTime.now();
      final pub = PublicationModel(
        id: '',
        authorId: authorId,
        authorName: authorName,
        authorPhoto: authorPhoto,
        type: type,
        mediaUrl: url,
        caption: caption,
        createdAt: now,
        expiresAt: type == 'story'
            ? now.add(const Duration(hours: 24))
            : null,
      );

      final doc = await _db.collection('publications').add(pub.toMap());
      notifyListeners();
      return PublicationModel.fromMap({...pub.toMap(), 'id': doc.id});
    } catch (e) {
      debugPrint('Erreur publication: $e');
      return null;
    }
  }

  // Like
  Future<void> like(String pubId, String userId) async {
    final ref = _db.collection('publications').doc(pubId);
    final likeRef = ref.collection('likes').doc(userId);
    final likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      await likeRef.delete();
      await ref.update({'likes': FieldValue.increment(-1)});
    } else {
      await likeRef.set({'at': DateTime.now().toIso8601String()});
      await ref.update({'likes': FieldValue.increment(1)});
    }
  }

  // Incrémenter les vues (monétisation)
  Future<void> addView(String pubId, String authorId) async {
    await _db.collection('publications').doc(pubId).update({
      'views': FieldValue.increment(1),
    });
    await _db.collection('users').doc(authorId).update({
      'totalViews': FieldValue.increment(1),
    });
  }

  Future<void> delete(String pubId) async {
    await _db.collection('publications').doc(pubId).delete();
    notifyListeners();
  }
}