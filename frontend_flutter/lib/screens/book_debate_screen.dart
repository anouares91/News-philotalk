import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:philosophy_ai_talk/data/philosophers_data.dart';
import 'package:philosophy_ai_talk/models/dialogue.dart';
import 'package:philosophy_ai_talk/screens/video_screen.dart';
import 'package:philosophy_ai_talk/services/ai_service.dart';
import 'package:philosophy_ai_talk/services/audio_service.dart';
import 'package:philosophy_ai_talk/services/database_service.dart';
import 'package:philosophy_ai_talk/services/api_service.dart';
import 'package:google_fonts/google_fonts.dart';

class BookDebateScreen extends StatefulWidget {
  const BookDebateScreen({super.key});

  @override
  State<BookDebateScreen> createState() => _BookDebateScreenState();
}

class _BookDebateScreenState extends State<BookDebateScreen> {
  final TextEditingController _bookTitleController = TextEditingController();
  final TextEditingController _bookAuthorController = TextEditingController();
  
  Philosopher? _selectedP1;
  Philosopher? _selectedP2;
  String _selectedLanguage = 'en';
  String _selectedAmbient = 'None';
  
  bool _isGenerating = false;
  String _generationStatus = '';

  final List<String> _ambientSounds = ['None', 'Cafe', 'Rain', 'Library', 'Nature', 'Wind'];

  @override
  void initState() {
    super.initState();
    if (philosophersData.length >= 2) {
      _selectedP1 = philosophersData[0];
      _selectedP2 = philosophersData[1];
    }
  }

  Future<void> _startBookDebate() async {
    final title = _bookTitleController.text.trim();
    if (title.isEmpty || _selectedP1 == null || _selectedP2 == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a book title and select two philosophers.')),
      );
      return;
    }

    setState(() {
      _isGenerating = true;
      _generationStatus = 'Analyzing book themes...';
    });

    try {
      final result = await AIService.generateBookDebate(
        p1: _selectedP1!.name,
        p2: _selectedP2!.name,
        bookTitle: title,
        bookAuthor: _bookAuthorController.text.trim().isNotEmpty ? _bookAuthorController.text.trim() : null,
        language: _selectedLanguage,
      );

      final List<DialogueLine> script = result['debate'];

      setState(() => _generationStatus = 'Initiating HeyGen Video...');

      // Generate Video with HeyGen via Backend
      final videoResult = await ApiService.generateVideo(
        dialogue: script.map((l) => {'speaker': l.speaker, 'text': l.text}).toList(),
        philosopher1: _selectedP1!.name,
        philosopher2: _selectedP2!.name,
        language: _selectedLanguage,
      );

      final String videoId = videoResult['data']['video_id'];
      
      // Start Ambient Sound if selected
      if (_selectedAmbient != 'None') {
        await AudioService.playAmbientSound(_selectedAmbient.toLowerCase());
      }

      // Save to Firestore
      await DatabaseService.saveGeneration(
        id: videoId,
        p1: _selectedP1!.name,
        p2: _selectedP2!.name,
        topic: 'Debate on "$title"',
        language: _selectedLanguage,
        status: 'processing',
        script: script.map((l) => l.toJson()).toList(),
      );

      if (mounted) {
        setState(() => _isGenerating = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => VideoScreen(
              videoId: videoId,
              p1: _selectedP1!.name,
              p2: _selectedP2!.name,
              topic: 'Debate on "$title"',
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Book debate error: $e');
      if (mounted) {
        setState(() => _isGenerating = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate book debate: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  void dispose() {
    _bookTitleController.dispose();
    _bookAuthorController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Book Debate Mode',
          style: GoogleFonts.philosopher(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isGenerating
          ? _buildLoadingState()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionHeader('1. Select Book'),
                  const SizedBox(height: 16),
                  _buildTextField(_bookTitleController, 'Book Title (e.g., 1984, The Republic)'),
                  const SizedBox(height: 12),
                  _buildTextField(_bookAuthorController, 'Author (Optional)'),
                  
                  const SizedBox(height: 40),
                  _buildSectionHeader('2. Select Philosophers'),
                  const SizedBox(height: 16),
                  _buildPhilosopherPicker(),
                  
                  const SizedBox(height: 40),
                  _buildSectionHeader('3. Language'),
                  const SizedBox(height: 16),
                  _buildLanguagePicker(),

                  const SizedBox(height: 40),
                  _buildSectionHeader('4. Ambient Sound'),
                  const SizedBox(height: 16),
                  _buildAmbientPicker(),
                  
                  const SizedBox(height: 60),
                  _buildStartButton(),
                ],
              ),
            ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 80,
            height: 80,
            child: CircularProgressIndicator(color: Colors.orange, strokeWidth: 6),
          ),
          const SizedBox(height: 40),
          Text(
            _generationStatus,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          const Text(
            'The AI is analyzing the book and preparing the debate script.',
            style: TextStyle(color: Colors.white54, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.white54),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildPhilosopherPicker() {
    return Row(
      children: [
        Expanded(child: _buildPhilosopherDropdown(_selectedP1, (val) => setState(() => _selectedP1 = val))),
        const SizedBox(width: 16),
        const Icon(LucideIcons.swords, color: Colors.orange, size: 24),
        const SizedBox(width: 16),
        Expanded(child: _buildPhilosopherDropdown(_selectedP2, (val) => setState(() => _selectedP2 = val))),
      ],
    );
  }

  Widget _buildPhilosopherDropdown(Philosopher? selected, Function(Philosopher?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<Philosopher>(
          value: selected,
          dropdownColor: Colors.grey[900],
          isExpanded: true,
          icon: const Icon(LucideIcons.chevronDown, color: Colors.white54, size: 16),
          items: philosophersData.map((p) {
            return DropdownMenuItem(
              value: p,
              child: Text(p.name, style: const TextStyle(color: Colors.white, fontSize: 13)),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildLanguagePicker() {
    final languages = [
      {'code': 'en', 'name': 'English'},
      {'code': 'ar', 'name': 'Arabic'},
      {'code': 'es', 'name': 'Spanish'},
      {'code': 'fr', 'name': 'French'},
    ];

    return Wrap(
      spacing: 12,
      children: languages.map((lang) {
        final isSelected = _selectedLanguage == lang['code'];
        return GestureDetector(
          onTap: () => setState(() => _selectedLanguage = lang['code']!),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? Colors.orange : Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isSelected ? Colors.orange : Colors.white.withOpacity(0.1)),
            ),
            child: Text(
              lang['name']!,
              style: TextStyle(
                color: isSelected ? Colors.black : Colors.white,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAmbientPicker() {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: _ambientSounds.map((sound) {
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
      }).toList(),
    );
  }

  Widget _buildStartButton() {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: ElevatedButton(
        onPressed: _startBookDebate,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.orange,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 0,
        ),
        child: const Text(
          'Generate Book Debate',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
