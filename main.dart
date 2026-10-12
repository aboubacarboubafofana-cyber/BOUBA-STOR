import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'services/auth_service.dart';
import 'services/publication_service.dart';
import 'services/monetization_service.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => PublicationService()),
        ChangeNotifierProvider(create: (_) => MonetizationService()),
      ],
      child: MaterialApp(
        title: 'Mon App',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.deepPurple,
          useMaterial3: true,
          fontFamily: 'Roboto',
        ),
        home: const SplashScreen(),
      ),
    );
  }
}