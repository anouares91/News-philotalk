import 'package:flutter/material.dart';
import 'package:philosophy_ai_talk/screens/generate_screen.dart';
import 'package:philosophy_ai_talk/screens/video_screen.dart';
import 'package:philosophy_ai_talk/screens/profile_screen.dart';
import 'package:philosophy_ai_talk/screens/interview_screen.dart';
import 'package:philosophy_ai_talk/screens/avatar_customizer_screen.dart';
import 'package:philosophy_ai_talk/data/philosophers_data.dart';
import 'package:philosophy_ai_talk/services/database_service.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const HomeContent(),
    const CommunityContent(),
    const SizedBox.shrink(), // Placeholder for FAB
    const HistoryContent(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          if (index == 2) return; // Ignore middle item
          setState(() {
            _selectedIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.black.withOpacity(0.9),
        selectedItemColor: Colors.orange,
        unselectedItemColor: Colors.white.withOpacity(0.4),
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
        unselectedLabelStyle: const TextStyle(fontSize: 10),
        items: const [
          BottomNavigationBarItem(icon: Icon(LucideIcons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.users), label: 'Community'),
          BottomNavigationBarItem(icon: SizedBox(height: 20), label: ''), // Spacer
          BottomNavigationBarItem(icon: Icon(LucideIcons.history), label: 'History'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.user), label: 'Profile'),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, '/generate');
        },
        backgroundColor: Colors.orange,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: const Icon(LucideIcons.plus, color: Colors.white, size: 30),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }
}

class HomeContent extends StatelessWidget {
  const HomeContent({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'PhiloTalk',
                style: GoogleFonts.inter(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              IconButton(
                icon: const Icon(LucideIcons.settings),
                onPressed: () {},
              ),
            ],
          ),
          const SizedBox(height: 30),
          _buildHeroCard(context),
          const SizedBox(height: 30),
          _buildFeatureGrid(context),
          const SizedBox(height: 40),
          _buildSectionHeader('Recent Dialogues'),
          const SizedBox(height: 20),
          _buildRecentDialogues(context),
          const SizedBox(height: 40),
          _buildSectionHeader('Explore Philosophers'),
          const SizedBox(height: 20),
          _buildPhilosophersList(context),
        ],
      ),
    );
  }

  Widget _buildFeatureGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _buildFeatureCard(
          context,
          'Live Interview',
          LucideIcons.mic,
          Colors.blue,
          () {
            if (philosophersData.isNotEmpty) {
              final p = philosophersData[0];
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => InterviewScreen(
                    interviewId: 'interview_${DateTime.now().millisecondsSinceEpoch}',
                    philosopherId: p.id,
                    philosopherName: p.name,
                    avatarUrl: p.image ?? '',
                  ),
                ),
              );
            }
          },
        ),
        _buildFeatureCard(
          context,
          'Book Debate',
          LucideIcons.bookOpen,
          Colors.purple,
          () => Navigator.pushNamed(context, '/book-debate'),
        ),
        _buildFeatureCard(
          context,
          'AI Judge',
          LucideIcons.gavel,
          Colors.green,
          () {},
        ),
        _buildFeatureCard(
          context,
          'Social Mode',
          LucideIcons.smartphone,
          Colors.pink,
          () => Navigator.pushNamed(context, '/social-mode'),
        ),
      ],
    );
  }

  Widget _buildFeatureCard(BuildContext context, String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.orange, Colors.red],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Generate New Dialogue',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Create a cinematic philosophical conversation between two masters.',
            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/generate'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text('Start Now'),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        TextButton(
          onPressed: () {},
          child: const Text('View All', style: TextStyle(color: Colors.orange)),
        ),
      ],
    );
  }

  Widget _buildRecentDialogues(BuildContext context) {
    return Column(
      children: [
        _buildDialogueCard(context, 'Socrates vs Plato', 'The Nature of Truth', '2 hours ago'),
        const SizedBox(height: 16),
        _buildDialogueCard(context, 'Nietzsche vs Aristotle', 'The Meaning of Life', '5 hours ago'),
      ],
    );
  }

  Widget _buildDialogueCard(BuildContext context, String title, String topic, String time) {
    return InkWell(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const VideoScreen())),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.play, color: Colors.orange),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('Topic: $topic', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                  const SizedBox(height: 4),
                  Text(time, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhilosophersList(BuildContext context) {
    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: philosophersData.length,
        itemBuilder: (context, index) {
          final philosopher = philosophersData[index];
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => AvatarCustomizerScreen(
                    philosopherId: philosopher.id,
                    philosopherName: philosopher.name,
                    initialImageUrl: philosopher.image ?? '',
                  ),
                ),
              );
            },
            child: Container(
              width: 80,
              margin: const EdgeInsets.only(right: 16),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 35,
                    backgroundColor: Colors.orange.withOpacity(0.2),
                    backgroundImage: philosopher.image != null ? NetworkImage(philosopher.image!) : null,
                    child: philosopher.image == null ? const Icon(LucideIcons.user, color: Colors.orange) : null,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    philosopher.name,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class HistoryContent extends StatelessWidget {
  const HistoryContent({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text('My History', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: DatabaseService.getUserGenerations(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.orange));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return _buildEmptyState('No history found.', LucideIcons.history);
          }

          final generations = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: generations.length,
            itemBuilder: (context, index) {
              final gen = generations[index];
              return _buildGenerationCard(context, gen, isHistory: true);
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.white24),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Colors.white54)),
        ],
      ),
    );
  }

  Widget _buildGenerationCard(BuildContext context, Map<String, dynamic> gen, {bool isHistory = false}) {
    final createdAt = gen['createdAt'] as Timestamp?;
    final dateStr = createdAt != null ? DateFormat('MMM d, yyyy • HH:mm').format(createdAt.toDate()) : 'Recent';
    final isPublic = gen['isPublic'] ?? false;
    final videoId = gen['id'] ?? '';
    final videoUrl = gen['video_url'];

    return GestureDetector(
      onTap: () {
        if (videoId.isNotEmpty) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => VideoScreen(
                videoId: videoId,
                videoUrl: videoUrl,
              ),
            ),
          );
        }
      },
      child: Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.play, color: Colors.orange),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${gen['p1_id']} vs ${gen['p2_id']}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Text(
                      gen['topic'] ?? 'No topic',
                      style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(dateStr, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10)),
                  ],
                ),
              ),
              if (isHistory)
                IconButton(
                  icon: Icon(
                    isPublic ? LucideIcons.globe : LucideIcons.lock,
                    color: isPublic ? Colors.green : Colors.white38,
                    size: 20,
                  ),
                  onPressed: () {
                    DatabaseService.togglePublicStatus(gen['id'], !isPublic);
                  },
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (!isHistory)
                Expanded(
                  child: Text(
                    'Shared by: ${gen['userEmail']?.split('@')[0] ?? 'Anonymous'}',
                    style: TextStyle(color: Colors.white38, fontSize: 10, fontStyle: FontStyle.italic),
                  ),
                ),
              TextButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => VideoScreen(
                        videoId: gen['id'] ?? '',
                        videoUrl: gen['video_url'],
                      ),
                    ),
                  );
                },
                icon: const Icon(LucideIcons.playCircle, size: 16, color: Colors.orange),
                label: const Text('Play', style: TextStyle(color: Colors.orange, fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    ),
    );
  }
}

class CommunityContent extends StatelessWidget {
  const CommunityContent({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text('Community Feed', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: DatabaseService.getPublicGenerations(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.orange));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.users, size: 64, color: Colors.white24),
                  const SizedBox(height: 16),
                  Text('No public dialogues yet.', style: TextStyle(color: Colors.white54)),
                ],
              ),
            );
          }

          final generations = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: generations.length,
            itemBuilder: (context, index) {
              final gen = generations[index];
              return const HistoryContent()._buildGenerationCard(context, gen, isHistory: false);
            },
          );
        },
      ),
    );
  }
}
