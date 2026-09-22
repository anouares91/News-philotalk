import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:philosophy_ai_talk/screens/splash_screen.dart';
import 'package:philosophy_ai_talk/screens/home_screen.dart';
import 'package:philosophy_ai_talk/screens/generate_screen.dart';
import 'package:philosophy_ai_talk/screens/video_screen.dart';
import 'package:philosophy_ai_talk/screens/profile_screen.dart';
import 'package:philosophy_ai_talk/screens/interview_screen.dart';
import 'package:philosophy_ai_talk/screens/book_debate_screen.dart';
import 'package:philosophy_ai_talk/screens/social_mode_screen.dart';
import 'package:philosophy_ai_talk/services/auth_service.dart';
import 'package:google_fonts/google_fonts.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: "AIzaSyDu_onmVub3Gme6jXfbAoGZqOmrfigiGiE",
      appId: "1:858819116591:web:6a77d5c5e6c771fe8510da",
      messagingSenderId: "858819116591",
      projectId: "gen-lang-client-0226731352",
      authDomain: "gen-lang-client-0226731352.firebaseapp.com",
      storageBucket: "gen-lang-client-0226731352.firebasestorage.app",
    ),
  );
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PhiloTalk',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.orange,
        scaffoldBackgroundColor: const Color(0xFF0A0A0A),
        textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme).apply(
          bodyColor: Colors.white,
          displayColor: Colors.white,
        ),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/home': (context) => const HomeScreen(),
        '/generate': (context) => const GenerateScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/book-debate': (context) => const BookDebateScreen(),
        '/interview': (context) => const InterviewScreen(),
        '/social-mode': (context) => const SocialModeScreen(),
      },
    );
  }
}
