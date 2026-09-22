import 'package:flutter/material.dart';
import 'package:philosophy_ai_talk/screens/video_screen.dart';
import 'package:philosophy_ai_talk/data/philosophers_data.dart';
import 'package:philosophy_ai_talk/services/api_service.dart';
import 'package:philosophy_ai_talk/services/ai_service.dart';
import 'package:philosophy_ai_talk/services/database_service.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:google_fonts/google_fonts.dart';

class SocialModeScreen extends StatefulWidget {
  const SocialModeScreen({super.key});

  @override
  State<SocialModeScreen> createState() => _SocialModeScreenState();
}

class _SocialModeScreenState extends State<SocialModeScreen> {
  int _step = 1;
  String? _p1;
  String? _topic;
  String _selectedEffect = 'Neon Pulse';
  bool _isGenerating = false;
  String _loadingText = 'Generating Social Clip...';

  final List<String> _effects = ['Neon Pulse', 'Glitch Art', 'Cinematic Blur', 'Retro VHS', 'Minimalist'];

  Future<void> _handleGenerate() async {
    setState(() {
      _isGenerating = true;
      _loadingText = 'Crafting Viral Content...';
    });

    try {
      // 1. Generate short dialogue for social
      final dialogueScript = await AIService.generateDialogue(
        p1: _p1!,
        p2: 'Host', // In social mode, maybe it's a solo or with a host
        topic: _topic!,
        language: 'en',
      );

      // 2. Generate Video (9:16)
      final result = await ApiService.generateVideo(
        dialogue: dialogueScript.take(4).map((l) => {'speaker': l.speaker, 'text': l.text}).toList(),
        philosopher1: _p1!,
        philosopher2: 'Host',
        language: 'en',
      );

      final videoId = result['data']['video_id'];

      // 3. Save to Firestore
      await DatabaseService.saveGeneration(
        id: videoId,
        p1: _p1!,
        p2: 'Host',
        topic: 'Social Clip: $_topic',
        language: 'en',
        status: 'processing',
        script: dialogueScript.take(4).map((l) => l.toJson()).toList(),
      );

      if (mounted) {
        setState(() => _isGenerating = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => VideoScreen(
              videoId: videoId,
              p1: _p1!,
              p2: 'Host',
              topic: 'Social Clip: $_topic',
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Social generation error: $e');
      if (mounted) {
        setState(() => _isGenerating = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isGenerating) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SpinKitFadingCube(color: Colors.orange, size: 80),
              const SizedBox(height: 40),
              Text(_loadingText, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              const Text('Optimizing for 9:16 vertical format...', style: TextStyle(color: Colors.white54)),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Mode (9:16)'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_step == 1) _buildStep1(),
            if (_step == 2) _buildStep2(),
            if (_step == 3) _buildStep3(),
          ],
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Philosopher', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: philosophersData.length,
              itemBuilder: (context, index) {
                final p = philosophersData[index];
                return InkWell(
                  onTap: () => setState(() { _p1 = p.name; _step = 2; }),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(radius: 30, backgroundImage: p.image != null ? NetworkImage(p.image!) : null),
                        const SizedBox(height: 10),
                        Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    final topics = ['Stoicism in 60s', 'Existential Crisis', 'The Meaning of Life', 'AI Ethics', 'Modern Love'];
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Viral Topic', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Expanded(
            child: ListView.builder(
              itemCount: topics.length,
              itemBuilder: (context, index) {
                final t = topics[index];
                return ListTile(
                  title: Text(t),
                  trailing: const Icon(LucideIcons.chevronRight, color: Colors.orange),
                  onTap: () => setState(() { _topic = t; _step = 3; }),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep3() {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Visual Effect', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: _effects.map((e) {
              final isSelected = _selectedEffect == e;
              return ChoiceChip(
                label: Text(e),
                selected: isSelected,
                onSelected: (val) => setState(() => _selectedEffect = e),
                selectedColor: Colors.orange,
              );
            }).toList(),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: _handleGenerate,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              ),
              child: const Text('Generate Social Clip', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
