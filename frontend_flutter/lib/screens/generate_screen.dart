import 'package:flutter/material.dart';
import 'package:philosophy_ai_talk/screens/video_screen.dart';
import 'package:philosophy_ai_talk/data/philosophers_data.dart';
import 'package:philosophy_ai_talk/services/api_service.dart';
import 'package:philosophy_ai_talk/services/ai_service.dart';
import 'package:philosophy_ai_talk/services/audio_service.dart';
import 'package:philosophy_ai_talk/services/database_service.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

class GenerateScreen extends StatefulWidget {
  const GenerateScreen({super.key});

  @override
  State<GenerateScreen> createState() => _GenerateScreenState();
}

class _GenerateScreenState extends State<GenerateScreen> {
  int _step = 1;
  String? _p1;
  String? _p2;
  String? _topic;
  String _selectedFormat = '16:9';
  String _selectedAmbient = 'None';
  bool _isGenerating = false;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  String _loadingText = 'Generating Dialogue...';

  final List<String> _ambientSounds = ['None', 'Cafe', 'Rain', 'Library', 'Nature', 'Wind'];

  List<dynamic> _topics = [];
  bool _isLoadingTopics = true;

  @override
  void initState() {
    super.initState();
    _fetchTopics();
  }

  Future<void> _fetchTopics() async {
    try {
      final topics = await ApiService.getTopics();
      if (mounted) {
        setState(() {
          _topics = topics;
          _isLoadingTopics = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching topics: $e');
      if (mounted) {
        setState(() {
          _isLoadingTopics = false;
        });
      }
    }
  }

  List<Philosopher> get _filteredPhilosophers {
    if (_searchQuery.isEmpty) return philosophersData;
    return philosophersData.where((p) => p.name.toLowerCase().contains(_searchQuery.toLowerCase())).toList();
  }

  Future<void> _handleGenerate() async {
    setState(() {
      _isGenerating = true;
      _loadingText = 'Generating Dialogue...';
    });

    try {
      // 1. Get user language
      final prefs = await SharedPreferences.getInstance();
      final lang = prefs.getString('user_language') ?? 'English';
      final langCode = lang == 'Arabic' ? 'ar' : 'en';

      // 2. Generate Dialogue with AIService
      final dialogueScript = await AIService.generateDialogue(
        p1: _p1!,
        p2: _p2!,
        topic: _topic!,
        language: langCode,
      );

      setState(() {
        _loadingText = 'Initiating HeyGen Video...';
      });

      // 3. Generate Video with HeyGen via Backend
      final result = await ApiService.generateVideo(
        dialogue: dialogueScript.map((l) => {'speaker': l.speaker, 'text': l.text}).toList(),
        philosopher1: _p1!,
        philosopher2: _p2!,
        language: langCode,
      );

      final videoId = result['data']['video_id'];

      // 4. Start Ambient Sound if selected
      if (_selectedAmbient != 'None') {
        await AudioService.playAmbientSound(_selectedAmbient.toLowerCase());
      }

      // 4. Save to Firestore
      await DatabaseService.saveGeneration(
        id: videoId,
        p1: _p1!,
        p2: _p2!,
        topic: _topic!,
        language: langCode,
        status: 'processing',
        script: dialogueScript.map((l) => l.toJson()).toList(),
      );

      if (mounted) {
        setState(() {
          _isGenerating = false;
        });
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => VideoScreen(
              videoId: videoId,
              p1: _p1!,
              p2: _p2!,
              topic: _topic!,
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Generation error: $e');
      if (mounted) {
        setState(() {
          _isGenerating = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
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
              const SpinKitDoubleBounce(color: Colors.orange, size: 80),
              const SizedBox(height: 40),
              Text(_loadingText, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  'Our AI is currently crafting a deep philosophical conversation, generating voices, and animating avatars.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14),
                ),
              ),
              const SizedBox(height: 40),
              Container(
                width: 200,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(2),
                ),
                child: const LinearProgressIndicator(
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Dialogue'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildStepIndicator(1),
                const SizedBox(width: 8),
                _buildStepIndicator(2),
                const SizedBox(width: 8),
                _buildStepIndicator(3),
              ],
            ),
            const SizedBox(height: 40),
            if (_step == 1) _buildStep1(),
            if (_step == 2) _buildStep2(),
            if (_step == 3) _buildStep3(),
            if (_step == 4) _buildStep4(),
          ],
        ),
      ),
    );
  }

  Widget _buildStepIndicator(int step) {
    return Expanded(
      child: Container(
        height: 4,
        decoration: BoxDecoration(
          color: _step >= step ? Colors.orange : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildStep1() {
    final filtered = _filteredPhilosophers;
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select First Philosopher', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('Choose the first master for the dialogue.', style: TextStyle(color: Colors.white.withOpacity(0.6))),
          const SizedBox(height: 20),
          _buildSearchBar(),
          const SizedBox(height: 20),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.2,
              ),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final p = filtered[index];
                final name = p.name;
                return InkWell(
                  onTap: () {
                    setState(() {
                      _p1 = name;
                      _step = 2;
                      _searchQuery = '';
                      _searchController.clear();
                    });
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: _p1 == name ? Colors.orange.withOpacity(0.1) : Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _p1 == name ? Colors.orange : Colors.white.withOpacity(0.1)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundColor: Colors.white.withOpacity(0.1),
                          backgroundImage: p.image != null ? NetworkImage(p.image!) : null,
                          child: p.image == null ? const Icon(LucideIcons.user, color: Colors.orange) : null,
                        ),
                        const SizedBox(height: 8),
                        Text(name, style: const TextStyle(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
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
    final filtered = _filteredPhilosophers.where((p) => p.name != _p1).toList();
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Second Philosopher', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('Who will $_p1 be debating with?', style: TextStyle(color: Colors.white.withOpacity(0.6))),
          const SizedBox(height: 20),
          _buildSearchBar(),
          const SizedBox(height: 20),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.2,
              ),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final p = filtered[index];
                final name = p.name;
                return InkWell(
                  onTap: () {
                    setState(() {
                      _p2 = name;
                      _step = 3;
                      _searchQuery = '';
                      _searchController.clear();
                    });
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: _p2 == name ? Colors.orange.withOpacity(0.1) : Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _p2 == name ? Colors.orange : Colors.white.withOpacity(0.1)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundColor: Colors.white.withOpacity(0.1),
                          backgroundImage: p.image != null ? NetworkImage(p.image!) : null,
                          child: p.image == null ? const Icon(LucideIcons.user, color: Colors.orange) : null,
                        ),
                        const SizedBox(height: 8),
                        Text(name, style: const TextStyle(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
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

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (value) {
          setState(() {
            _searchQuery = value;
          });
        },
        decoration: InputDecoration(
          hintText: 'Search philosopher...',
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
          prefixIcon: Icon(LucideIcons.search, color: Colors.white.withOpacity(0.3), size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        ),
      ),
    );
  }

  Widget _buildStep3() {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Topic', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('What profound subject should they discuss?', style: TextStyle(color: Colors.white.withOpacity(0.6))),
          const SizedBox(height: 20),
          if (_isLoadingTopics)
            const Center(child: CircularProgressIndicator(color: Colors.orange))
          else if (_topics.isEmpty)
            const Center(child: Text('No topics available.'))
          else
            Expanded(
              child: ListView.separated(
                itemCount: _topics.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final t = _topics[index];
                  final isSelected = _topic == t['name'];
                  return InkWell(
                    onTap: () {
                      setState(() {
                        _topic = t['name'];
                        _step = 4;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.orange.withOpacity(0.1) : Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isSelected ? Colors.orange : Colors.white.withOpacity(0.1)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                t['name'],
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? Colors.orange : Colors.white,
                                ),
                              ),
                              if (isSelected)
                                const Icon(LucideIcons.checkCircle2, color: Colors.orange, size: 20),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            t['description'],
                            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14),
                          ),
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

  Widget _buildStep4() {
    return Expanded(
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Final Settings', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Customize the cinematic experience.', style: TextStyle(color: Colors.white.withOpacity(0.6))),
            const SizedBox(height: 30),
            
            // Video Format
            const Text('Video Format', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildFormatCard('16:9', 'Landscape (YouTube)', LucideIcons.monitor),
                const SizedBox(width: 16),
                _buildFormatCard('9:16', 'Portrait (TikTok/Reels)', LucideIcons.smartphone),
              ],
            ),
            
            const SizedBox(height: 30),
            
            // Ambient Sound
            const Text('Ambient Sound', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _ambientSounds.map((s) => _buildAmbientChip(s)).toList(),
            ),
            
            const SizedBox(height: 60),
            
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: _handleGenerate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Generate Cinematic Video', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    SizedBox(width: 10),
                    Icon(LucideIcons.sparkles),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormatCard(String format, String label, IconData icon) {
    final isSelected = _selectedFormat == format;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedFormat = format),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected ? Colors.orange.withOpacity(0.1) : Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isSelected ? Colors.orange : Colors.white.withOpacity(0.1)),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? Colors.orange : Colors.white54),
              const SizedBox(height: 8),
              Text(format, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(label, style: const TextStyle(fontSize: 10, color: Colors.white54), textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAmbientChip(String sound) {
    final isSelected = _selectedAmbient == sound;
    return GestureDetector(
      onTap: () => setState(() => _selectedAmbient = sound),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.orange : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? Colors.orange : Colors.white.withOpacity(0.1)),
        ),
        child: Text(
          sound,
          style: TextStyle(
            color: isSelected ? Colors.black : Colors.white,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
