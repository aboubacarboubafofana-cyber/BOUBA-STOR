import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'community_model.dart';

class CommunityService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // --- CRÉATION DE GROUPE ---
  Future<String?> createGroup(String groupName) async {
    try {
      User? currentUser = _auth.currentUser;
      if (currentUser == null) return null;

      DocumentReference groupRef = await _firestore.collection('community_groups').add({
        'name': groupName,
        'adminId': currentUser.uid,
        'members': [currentUser.uid], // Le créateur est membre automatiquement
        'createdAt': FieldValue.serverTimestamp(),
      });

      return groupRef.id;
    } catch (e) {
      print("Erreur création groupe: $e");
      return null;
    }
  }

  // --- REJOINDRE UN GROUPE ---
  Future<void> joinGroup(String groupId) async {
    User? currentUser = _auth.currentUser;
    if (currentUser == null) return;

    await _firestore.collection('community_groups').doc(groupId).update({
      'members': FieldValue.arrayUnion([currentUser.uid])
    });
  }

  // --- QUITTER UN GROUPE ---
  Future<void> leaveGroup(String groupId) async {
    User? currentUser = _auth.currentUser;
    if (currentUser == null) return;

    await _firestore.collection('community_groups').doc(groupId).update({
      'members': FieldValue.arrayRemove([currentUser.uid])
    });
  }

  // --- ENVOYER UN MESSAGE (Chat de groupe) ---
  Future<void> sendGroupMessage(String groupId, String text) async {
    User? currentUser = _auth.currentUser;
    if (currentUser == null) return;

    // Récupérer le nom de l'utilisateur
    DocumentSnapshot userDoc = await _firestore.collection('users').doc(currentUser.uid).get();
    String userName = userDoc.exists ? (userDoc.data() as Map)['name'] ?? 'Utilisateur' : 'Utilisateur';

    await _firestore
        .collection('community_groups')
        .doc(groupId)
        .collection('messages')
        .add({
      'senderId': currentUser.uid,
      'senderName': userName,
      'text': text,
      'type': 'text',
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  // --- ÉCOUTER LES MESSAGES D'UN GROUPE ---
  Stream<List<CommunityMessage>> getGroupMessages(String groupId) {
    return _firestore
        .collection('community_groups')
        .doc(groupId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => CommunityMessage.fromMap(doc.data(), doc.id)).toList();
    });
  }

  // --- LISTER TOUS LES GROUPES PUBLICS ---
  Stream<QuerySnapshot> getAllGroups() {
    return _firestore.collection('community_groups').orderBy('createdAt', descending: true).snapshots();
  }
}