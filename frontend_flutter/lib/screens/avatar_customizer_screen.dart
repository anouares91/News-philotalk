import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:philosophy_ai_talk/services/database_service.dart';
import 'package:philosophy_ai_talk/widgets/avatar_view.dart';

class AvatarCustomizerScreen extends StatefulWidget {
  final String philosopherId;
  final String philosopherName;
  final String initialImageUrl;

  const AvatarCustomizerScreen({
    Key? key,
    required this.philosopherId,
    required this.philosopherName,
    required this.initialImageUrl,
  }) : super(key: key);

  @override
  State<AvatarCustomizerScreen> createState() => _AvatarCustomizerScreenState();
}

class _AvatarCustomizerScreenState extends State<AvatarCustomizerScreen> {
  String _selectedBackground = 'Library';
  String _selectedClothes = 'Classic Robes';
  String _selectedMicrophone = 'Vintage Studio';
  String _selectedLighting = 'Cinematic Warm';
  String _selectedCamera = 'Medium Shot';

  final List<String> _backgrounds = ['Library', 'Cafe', 'Mountain Top', 'Ancient Greece', 'Modern Studio', 'Rainy Window'];
  final List<String> _clothes = ['Classic Robes', 'Modern Suit', 'Casual Sweater', 'Academic Gown', 'Trench Coat'];
  final List<String> _microphones = ['Vintage Studio', 'Modern Podcast', 'Lavalier', 'No Mic', 'Golden Mic'];
  final List<String> _lighting = ['Cinematic Warm', 'Natural Daylight', 'Neon Cyberpunk', 'Dramatic Noir', 'Soft Studio'];
  final List<String> _cameraStyles = ['Medium Shot', 'Close Up', 'Low Angle', 'Wide Shot', 'Handheld'];

  bool _isSaving = false;

  Future<void> _saveConfiguration() async {
    setState(() => _isSaving = true);
    try {
      final config = {
        'background': _selectedBackground,
        'clothes': _selectedClothes,
        'microphone': _selectedMicrophone,
        'lighting': _selectedLighting,
        'cameraStyle': _selectedCamera,
      };

      await DatabaseService.saveAvatarConfig(
        philosopherId: widget.philosopherId,
        config: config,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Avatar configuration saved successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save configuration: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
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
          'Customize ${widget.philosopherName}',
          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        actions: [
          if (_isSaving)
            const Center(
              child: Padding(
                padding: EdgeInsets.only(right: 16.0),
                child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.orange)),
              ),
            )
          else
            TextButton(
              onPressed: _saveConfiguration,
              child: const Text('Save', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: Column(
        children: [
          // Preview Area
          Container(
            height: MediaQuery.of(context).size.height * 0.35,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black, Colors.grey[900]!],
              ),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AvatarView(
                    imageUrl: widget.initialImageUrl,
                    isSpeaking: false,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Preview: $_selectedBackground + $_selectedLighting',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),

          // Customization Options
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildOptionSection('Studio Background', _backgrounds, _selectedBackground, (val) {
                      setState(() => _selectedBackground = val);
                    }),
                    const SizedBox(height: 24),
                    _buildOptionSection('Clothes', _clothes, _selectedClothes, (val) {
                      setState(() => _selectedClothes = val);
                    }),
                    const SizedBox(height: 24),
                    _buildOptionSection('Microphone', _microphones, _selectedMicrophone, (val) {
                      setState(() => _selectedMicrophone = val);
                    }),
                    const SizedBox(height: 24),
                    _buildOptionSection('Lighting', _lighting, _selectedLighting, (val) {
                      setState(() => _selectedLighting = val);
                    }),
                    const SizedBox(height: 24),
                    _buildOptionSection('Camera Style', _cameraStyles, _selectedCamera, (val) {
                      setState(() => _selectedCamera = val);
                    }),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionSection(String title, List<String> options, String selectedValue, Function(String) onSelected) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: options.length,
            itemBuilder: (context, index) {
              final option = options[index];
              final isSelected = option == selectedValue;
              return GestureDetector(
                onTap: () => onSelected(option),
                child: Container(
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.orange : Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isSelected ? Colors.orange : Colors.white.withOpacity(0.1)),
                  ),
                  child: Center(
                    child: Text(
                      option,
                      style: TextStyle(
                        color: isSelected ? Colors.black : Colors.white,
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
