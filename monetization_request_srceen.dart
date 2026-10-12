import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/monetization_service.dart';
import '../services/payment_service.dart';

class MonetizationRequestScreen extends StatefulWidget {
  const MonetizationRequestScreen({super.key});

  @override
  State<MonetizationRequestScreen> createState() =>
      _MonetizationRequestScreenState();
}

class _MonetizationRequestScreenState
    extends State<MonetizationRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nom = TextEditingController();
  final _email = TextEditingController();
  final _tel = TextEditingController();
  final _pays = TextEditingController();
  final _numeroPaiement = TextEditingController();
  String _moyen = 'Wave';
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final u = context.read<AuthService>().currentUser;
    if (u != null) {
      _nom.text = u.nom;
      _email.text = u.email;
      _tel.text = u.telephone;
      _pays.text = u.pays;
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    final user = context.read<AuthService>().currentUser!;
    final service = context.read<MonetizationService>();
    final payment = PaymentService();

    final err = await service.submitRequest(
      userId: user.uid,
      nom: _nom.text,
      email: _email.text,
      telephone: _tel.text,
      pays: _pays.text,
      moyenPaiement: _moyen,
      numeroPaiement: _numeroPaiement.text,
    );

    if (err == null) {
      // Envoyer à l'admin via WhatsApp
      await payment.sendMonetizationRequest(
        nom: _nom.text,
        email: _email.text,
        telephone: _tel.text,
        pays: _pays.text,
        moyen: _moyen,
        numero: _numeroPaiement.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                '✅ Demande envoyée ! L\'admin va traiter votre monétisation.'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err), backgroundColor: Colors.red),
      );
    }

    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Demande de monétisation')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                color: Colors.amber.shade100,
                child: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(Icons.info, color: Colors.orange),
                        SizedBox(width: 8),
                        Text('Conditions requises',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16)),
                      ]),
                      SizedBox(height: 8),
                      Text('✅ Minimum 1000 abonnés\n'
                          '✅ 10 000 vues cumulées\n'
                          '✅ Compte actif depuis 30 jours\n'
                          '✅ Contenu conforme aux règles\n'
                          '✅ Paiement via Wave ou Orange Money'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _nom,
                decoration: const InputDecoration(
                  labelText: 'Nom complet',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons