import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../widgets/avatar_view.dart';
import '../services/ai_service.dart';
import '../services/audio_service.dart';
import '../services/database_service.dart';

class InterviewScreen extends StatefulWidget {
  final String interviewId;
  final String philosopherId;
  final String philosopherName;
  final String avatarUrl;

  const InterviewScreen({
    Key? key,
    required this.interviewId,
    required this.philosopherId,
    required this.philosopherName,
    required this.avatarUrl,
  }) : super(key: key);

  @override
  State<InterviewScreen> createState() => _InterviewScreenState();
}

class _InterviewScreenState extends State<InterviewScreen> {
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, String>> _messages = [];
  bool _isRecording = false;
  bool _isPhilosopherSpeaking = false;
  bool _isAiThinking = false;
  double _currentVolume = 0.0; // Simulated volume for avatar

  @override
  void initState() {
    super.initState();
    _initializeInterview();
  }

  Future<void> _initializeInterview() async {
    // Add initial greeting
    final greeting = 'Greetings. I am ${widget.philosopherName}. What philosophical inquiry brings you here today?';
    setState(() {
      _messages.add({
        'role': 'ai',
        'text': greeting,
      });
    });

    await DatabaseService.saveInterviewMessage(
      interviewId: widget.interviewId,
      philosopherId: widget.philosopherId,
      role: 'ai',
      text: greeting,
    );
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isAiThinking) return;

    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _messageController.clear();
      _isPhilosopherSpeaking = false;
      _isAiThinking = true;
    });

    // Save user message to Firestore
    await DatabaseService.saveInterviewMessage(
      interviewId: widget.interviewId,
      philosopherId: widget.philosopherId,
      role: 'user',
      text: text,
    );

    try {
      // Generate AI Response using Gemini
      final responseText = await AIService.generateInterviewResponse(
        philosopher: widget.philosopherName,
        userMessage: text,
        chatHistory: _messages,
        language: 'en', // Can be dynamic based on user settings
      );

      if (mounted) {
        setState(() {
          _messages.add({
            'role': 'ai',
            'text': responseText,
          });
          _isAiThinking = false;
          _isPhilosopherSpeaking = true;
          _simulateSpeaking();
        });

        // Save AI response to Firestore
        await DatabaseService.saveInterviewMessage(
          interviewId: widget.interviewId,
          philosopherId: widget.philosopherId,
          role: 'ai',
          text: responseText,
        );

        // Generate TTS (Placeholder for actual audio playback)
        await AudioService.generateSpeech(
          text: responseText,
          speakerName: widget.philosopherName,
          voiceName: 'Kore', // Map philosopher to voice
        );
      }
    } catch (e) {
      debugPrint("Error generating response: \$e");
      if (mounted) {
        setState(() {
          _isAiThinking = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to get response. Try again.')),
        );
      }
    }
  }

  void _simulateSpeaking() {
    // Simulate audio volume changes for the avatar animation
    if (!_isPhilosopherSpeaking) return;
    
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted && _isPhilosopherSpeaking) {
        setState(() {
          // Random volume between 0.3 and 1.0
          _currentVolume = 0.3 + (DateTime.now().millisecondsSinceEpoch % 70) / 100.0;
        });
        _simulateSpeaking();
      } else if (mounted) {
        setState(() {
          _currentVolume = 0.0;
        });
      }
    });
    
    // Stop speaking after 5 seconds
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() {
          _isPhilosopherSpeaking = false;
          _currentVolume = 0.0;
        });
      }
    });
  }

  void _toggleRecording() {
    setState(() {
      _isRecording = !_isRecording;
    });
    // Implement actual audio recording logic here
  }

  @override
  void dispose() {
    _messageController.dispose();
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
          'Interview with ${widget.philosopherName}',
          style: const TextStyle(color: Colors.white, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.moreVertical, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Top: Avatar View
          Container(
            height: MediaQuery.of(context).size.height * 0.35,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black,
                  Colors.grey[900]!,
                ],
              ),
            ),
            child: Center(
              child: AvatarView(
                imageUrl: widget.avatarUrl,
                isSpeaking: _isPhilosopherSpeaking,
                audioVolume: _currentVolume,
                waveColor: Colors.orange,
              ),
            ),
          ),

          // Middle: Chat History
          Expanded(
            child: Container(
              color: Colors.black,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final message = _messages[index];
                  final isUser = message['role'] == 'user';

                  return Align(
                    alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      constraints: BoxConstraints(
                        maxWidth: MediaQuery.of(context).size.width * 0.75,
                      ),
                      decoration: BoxDecoration(
                        color: isUser ? Colors.orange.withOpacity(0.2) : Colors.white10,
                        borderRadius: BorderRadius.circular(16).copyWith(
                          bottomRight: isUser ? const Radius.circular(0) : const Radius.circular(16),
                          bottomLeft: !isUser ? const Radius.circular(0) : const Radius.circular(16),
                        ),
                        border: Border.all(
                          color: isUser ? Colors.orange.withOpacity(0.5) : Colors.white24,
                          width: 1,
                        ),
                      ),
                      child: Text(
                        message['text'] ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 16, height: 1.4),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Bottom: Chat Input
          Container(
            padding: const EdgeInsets.all(16).copyWith(bottom: MediaQuery.of(context).padding.bottom + 16),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              border: const Border(top: BorderSide(color: Colors.white10)),
            ),
            child: Row(
              children: [
                // Microphone Button
                GestureDetector(
                  onTap: _toggleRecording,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isRecording ? Colors.red.withOpacity(0.2) : Colors.white10,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _isRecording ? Colors.red : Colors.transparent,
                      ),
                    ),
                    child: Icon(
                      _isRecording ? LucideIcons.square : LucideIcons.mic,
                      color: _isRecording ? Colors.red : Colors.white,
                      size: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                
                // Text Input
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: TextField(
                      controller: _messageController,
                      style: const TextStyle(color: Colors.white),
                      enabled: !_isAiThinking,
                      decoration: InputDecoration(
                        hintText: _isAiThinking ? 'Philosopher is thinking...' : 'Ask a question...',
                        hintStyle: const TextStyle(color: Colors.white54),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                
                // Send Button
                GestureDetector(
                  onTap: _isAiThinking ? null : _sendMessage,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isAiThinking ? Colors.grey : Colors.orange,
                      shape: BoxShape.circle,
                    ),
                    child: _isAiThinking 
                      ? const SizedBox(
                          width: 20, 
                          height: 20, 
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                        )
                      : const Icon(
                          LucideIcons.send,
                          color: Colors.white,
                          size: 20,
                        ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
