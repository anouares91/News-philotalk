import 'package:flutter/material.dart';
import 'package:philosophy_ai_talk/services/database_service.dart';
import 'package:philosophy_ai_talk/screens/video_screen.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

class MyVideosScreen extends StatelessWidget {
  const MyVideosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: Text('My Generations', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: DatabaseService.getUserGenerations(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.orange));
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.videoOff, size: 64, color: Colors.white.withOpacity(0.2)),
                  const SizedBox(height: 20),
                  Text(
                    'No videos yet',
                    style: GoogleFonts.inter(fontSize: 18, color: Colors.white.withOpacity(0.4)),
                  ),
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
              final date = (gen['createdAt'] as dynamic)?.toDate() ?? DateTime.now();
              final formattedDate = DateFormat('MMM d, yyyy • HH:mm').format(date);

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => VideoScreen(
                          videoId: gen['id'],
                          p1: gen['philosopher1'],
                          p2: gen['philosopher2'],
                          topic: gen['topic'],
                        ),
                      ),
                    );
                  },
                  title: Text(
                    '${gen['philosopher1']} vs ${gen['philosopher2']}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(
                        'Topic: ${gen['topic']}',
                        style: GoogleFonts.inter(color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(LucideIcons.calendar, size: 12, color: Colors.white.withOpacity(0.4)),
                          const SizedBox(width: 4),
                          Text(
                            formattedDate,
                            style: GoogleFonts.inter(color: Colors.white.withOpacity(0.4), fontSize: 11),
                          ),
                          const Spacer(),
                          _buildStatusBadge(gen['status']),
                        ],
                      ),
                    ],
                  ),
                  trailing: const Icon(LucideIcons.chevronRight, color: Colors.white24),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    IconData icon;
    String label = status.toUpperCase();

    switch (status) {
      case 'completed':
        color = Colors.green;
        icon = LucideIcons.checkCircle2;
        break;
      case 'failed':
        color = Colors.red;
        icon = LucideIcons.alertCircle;
        break;
      default:
        color = Colors.orange;
        icon = LucideIcons.loader2;
        label = 'PROCESSING';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}
