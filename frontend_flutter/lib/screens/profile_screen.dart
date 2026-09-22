import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:philosophy_ai_talk/screens/my_videos_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _selectedLanguage = 'English';
  bool _isLoading = false;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  final List<Map<String, String>> _languages = [
    {'name': 'Arabic', 'flag': '🇸🇦'},
    {'name': 'English', 'flag': '🇺🇸'},
    {'name': 'French', 'flag': '🇫🇷'},
    {'name': 'German', 'flag': '🇩🇪'},
    {'name': 'Spanish', 'flag': '🇪🇸'},
    {'name': 'Italian', 'flag': '🇮🇹'},
  ];

  @override
  void initState() {
    super.initState();
    _loadLanguage();
  }

  // Load language from SharedPreferences first, then sync with Firebase
  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final localLang = prefs.getString('user_language');
    
    if (localLang != null) {
      setState(() {
        _selectedLanguage = localLang;
      });
    }

    // Sync from Firebase if user is logged in
    final user = _auth.currentUser;
    if (user != null) {
      try {
        final doc = await _firestore.collection('users').doc(user.uid).get();
        if (doc.exists && doc.data() != null) {
          final firestoreLang = doc.data()!['language'] as String?;
          if (firestoreLang != null && firestoreLang != _selectedLanguage) {
            setState(() {
              _selectedLanguage = firestoreLang;
            });
            await prefs.setString('user_language', firestoreLang);
          }
        }
      } catch (e) {
        debugPrint('Error syncing language from Firestore: $e');
      }
    }
  }

  // Update language locally and on Firebase
  Future<void> _updateLanguage(String language) async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 1. Update SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_language', language);

      // 2. Update Firestore
      final user = _auth.currentUser;
      if (user != null) {
        await _firestore.collection('users').doc(user.uid).set({
          'language': language,
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }

      setState(() {
        _selectedLanguage = language;
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Language updated to $language'),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating language: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 60, 20, 100),
        child: Column(
          children: [
            // Profile Header
            CircleAvatar(
              radius: 50,
              backgroundColor: Colors.orange,
              child: Text(
                (_auth.currentUser?.email ?? 'U')[0].toUpperCase(),
                style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              _auth.currentUser?.displayName ?? 'Philosopher',
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _auth.currentUser?.email ?? 'No email',
              style: GoogleFonts.inter(
                color: Colors.white.withOpacity(0.6),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 40),

            // Language Section Label
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'LANGUAGE',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.white.withOpacity(0.4),
                  letterSpacing: 1.2,
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Language Selection Row
            _buildLanguageRow(),
            const SizedBox(height: 40),

            // Menu Items
            _buildMenuSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageRow() {
    final currentLang = _languages.firstWhere((l) => l['name'] == _selectedLanguage, orElse: () => _languages[1]);
    return InkWell(
      onTap: _showLanguageBottomSheet,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Icon(LucideIcons.languages, color: Colors.orange.withOpacity(0.8), size: 20),
            const SizedBox(width: 16),
            Text(
              'App Language',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontWeight: FontWeight.w500,
                fontSize: 16,
              ),
            ),
            const Spacer(),
            Text(
              '${currentLang['flag']} ${currentLang['name']}',
              style: GoogleFonts.inter(
                color: Colors.orange,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(width: 8),
            Icon(LucideIcons.chevronRight, size: 16, color: Colors.white.withOpacity(0.4)),
          ],
        ),
      ),
    );
  }

  void _showLanguageBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF121212),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Select Language',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: _languages.length,
                      itemBuilder: (context, index) {
                        final lang = _languages[index];
                        final isSelected = _selectedLanguage == lang['name'];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            onTap: () async {
                              Navigator.pop(context);
                              await _updateLanguage(lang['name']!);
                            },
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.orange.withOpacity(0.1) : Colors.white.withOpacity(0.03),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isSelected ? Colors.orange : Colors.white.withOpacity(0.05),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Text(lang['flag']!, style: const TextStyle(fontSize: 20)),
                                  const SizedBox(width: 16),
                                  Text(
                                    lang['name']!,
                                    style: GoogleFonts.inter(
                                      color: isSelected ? Colors.orange : Colors.white,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const Spacer(),
                                  if (isSelected)
                                    const Icon(LucideIcons.checkCircle2, color: Colors.orange, size: 20),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildMenuSection() {
    return Column(
      children: [
        _buildMenuItem(LucideIcons.video, 'My Videos', () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MyVideosScreen()),
          );
        }),
        _buildMenuItem(LucideIcons.heart, 'Liked Dialogues', () {}),
        _buildMenuItem(LucideIcons.creditCard, 'Subscription', () {}),
        _buildMenuItem(LucideIcons.helpCircle, 'Help & Support', () {}),
        _buildMenuItem(LucideIcons.logOut, 'Logout', () async {
          await _auth.signOut();
          if (mounted) {
            Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
          }
        }, isDestructive: true),
      ],
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap, {bool isDestructive = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
        leading: Icon(
          icon,
          color: isDestructive ? Colors.redAccent : Colors.white.withOpacity(0.8),
        ),
        title: Text(
          title,
          style: GoogleFonts.inter(
            color: isDestructive ? Colors.redAccent : Colors.white,
            fontWeight: FontWeight.w500,
            fontSize: 16,
          ),
        ),
        trailing: Icon(
          LucideIcons.chevronRight,
          size: 16,
          color: Colors.white.withOpacity(0.4),
        ),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}
