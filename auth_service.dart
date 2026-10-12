import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../models/user_model.dart';

class AuthService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  bool get isLoggedIn => _auth.currentUser != null;

  AuthService() {
    _auth.authStateChanges().listen(_onAuthChanged);
  }

  Future<void> _onAuthChanged(User? user) async {
    if (user == null) {
      _currentUser = null;
    } else {
      _currentUser = await _getUserData(user.uid);
    }
    notifyListeners();
  }

  Future<UserModel?> _getUserData(String uid) async {
    final doc = await _db.collection('users').doc(uid).get();
    if (!doc.exists) return null;
    return UserModel.fromMap(doc.data()!);
  }

  Future<UserModel?> signUp({
    required String email,
    required String password,
    required String nom,
    required String telephone,
    required String pays,
  }) async {
    try {
      final cred = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      final user = UserModel(
        uid: cred.user!.uid,
        email: email,
        nom: nom,
        telephone: telephone,
        pays: pays,
        createdAt: DateTime.now(),
      );
      await _db.collection('users').doc(user.uid).set(user.toMap());
      _currentUser = user;
      notifyListeners();
      return user;
    } catch (e) {
      debugPrint('Erreur inscription: $e');
      return null;
    }
  }

  Future<UserModel?> signIn(String email, String password) async {
    try {
      final cred = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      _currentUser = await _getUserData(cred.user!.uid);
      notifyListeners();
      return _currentUser;
    } catch (e) {
      debugPrint('Erreur connexion: $e');
      return null;
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    _currentUser = null;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    if (_auth.currentUser != null) {
      _currentUser = await _getUserData(_auth.currentUser!.uid);
      notifyListeners();
    }
  }
}