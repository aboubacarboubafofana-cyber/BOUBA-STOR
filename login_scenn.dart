import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _pass = TextEditingController();
  final _nom = TextEditingController();
  final _tel = TextEditingController();
  final _pays = TextEditingController();
  bool _isSignUp = false;
  bool _loading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    final auth = context.read<AuthService>();
    dynamic result;

    if (_isSignUp) {
      result = await auth.signUp(
        email: _email.text.trim(),
        password: _pass.text,
        nom: _nom.text,
        telephone: _tel.text,
        pays: _pays.text,
      );
    } else {
      result = await auth.signIn(_email.text.trim(), _pass.text);
    }

    setState(() => _loading = false);

    if (result != null && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erreur, vérifiez vos informations')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 40),
                const Icon(Icons.public, size: 80, color: Colors.deepPurple),
                const SizedBox(height: 20),
                Text(_isSignUp ? 'Créer un compte' : 'Connexion',
                    style: const TextStyle(
                        fontSize: 28, fontWeight: FontWeight.bold)),
                const SizedBox(height: 30),
                if (_isSignUp) ...[
                  TextFormField(
                    controller: _nom,
                    decoration: const InputDecoration(
                      labelText: 'Nom complet',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (v) => v!.isEmpty ? 'Requis' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _tel,
                    decoration: const InputDecoration(
                      labelText: 'Téléphone',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone),
                    ),
                    validator: (v) => v!.isEmpty ? 'Requis' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pays,
                    decoration: const InputDecoration(
                      labelText: 'Pays',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.flag),
                    ),
                    validator: (v) => v!.isEmpty ? 'Requis' : null,
                  ),
                  const SizedBox(height: 12),
                ],
                TextFormField(
                  controller: _email,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.email),
                  ),
                  validator: (v) => v!.isEmpty ? 'Requis' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _pass,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Mot de passe',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock),
                  ),
                  validator: (v) => v!.length < 6 ? 'Min 6 caractères' : null,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(_isSignUp ? 'Créer' : 'Se connecter'),
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _isSignUp = !_isSignUp),
                  child: Text(_isSignUp
                      ? 'Déjà un compte ? Se connecter'
                      : 'Pas de compte ? S\'inscrire'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}