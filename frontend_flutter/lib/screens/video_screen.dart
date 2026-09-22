import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:philosophy_ai_talk/screens/judge_screen.dart';
import 'package:philosophy_ai_talk/services/api_service.dart';
import 'package:philosophy_ai_talk/services/database_service.dart';
import '../models/dialogue.dart';
import '../widgets/podcast_player.dart';

class VideoScreen extends StatefulWidget {
  final String videoId;
  final String? p1;
  final String? p2;
  final String? topic;
  final String? videoUrl;

  const VideoScreen({
    super.key,
    required this.videoId,
    this.p1,
    this.p2,
    this.topic,
    this.videoUrl,
  });

  @override
  State<VideoScreen> createState() => _VideoScreenState();
}

class _VideoScreenState extends State<VideoScreen> {
  bool _isReady = false;
  String? _videoUrl;
  String _status = 'Processing...';
  Timer? _pollingTimer;
  Dialogue? _dialogue;
  String? _p1;
  String? _p2;
  String? _topic;

  @override
  void initState() {
    super.initState();
    _p1 = widget.p1;
    _p2 = widget.p2;
    _topic = widget.topic;
    _videoUrl = widget.videoUrl;

    if (_videoUrl != null) {
      _loadExistingVideo();
    } else {
      _startPolling();
    }
  }

  Future<void> _loadExistingVideo() async {
    setState(() => _status = 'Loading Video Data...');
    try {
      final data = await DatabaseService.getGeneration(widget.videoId);
      if (data != null) {
        setState(() {
          _p1 = data['philosopher1'];
          _p2 = data['philosopher2'];
          _topic = data['topic'];
          _dialogue = Dialogue.fromJson(data);
          _isReady = true;
        });
      }
    } catch (e) {
      debugPrint('Error loading existing video: $e');
    }
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      try {
        // Ensure we have p1, p2, topic if they were null
        if (_p1 == null || _p2 == null || _topic == null) {
          final data = await DatabaseService.getGeneration(widget.videoId);
          if (data != null) {
            setState(() {
              _p1 = data['philosopher1'];
              _p2 = data['philosopher2'];
              _topic = data['topic'];
            });
          }
        }

        final result = await ApiService.getVideoStatus(widget.videoId);
        final status = result['data']['status'];
        
        if (status == 'completed') {
          timer.cancel();
          final videoUrl = result['data']['video_url'];
          
          // Fetch full data to get the script
          final data = await DatabaseService.getGeneration(widget.videoId);
          
          setState(() {
            _videoUrl = videoUrl;
            _isReady = true;
            
            if (data != null) {
              _dialogue = Dialogue.fromJson(data);
            } else {
              // Fallback to mock if somehow data is missing
              _dialogue = Dialogue(
                id: widget.videoId,
                p1Id: _p1 ?? 'P1',
                p2Id: _p2 ?? 'P2',
                topic: _topic ?? 'Topic',
                language: 'en',
                status: 'completed',
                videoFormat: '16:9',
                script: [
                  DialogueLine(speaker: _p1 ?? 'P1', text: "Welcome to this philosophical debate.", startTime: 0, duration: 3),
                  DialogueLine(speaker: _p2 ?? 'P2', text: "Thank you. Let's discuss ${_topic ?? 'Topic'}.", startTime: 3, duration: 4),
                ],
                videoUrl: _videoUrl,
              );
            }
          });
          // Update status in Firestore
          await DatabaseService.updateGenerationStatus(
            widget.videoId,
            'completed',
            videoUrl: videoUrl,
          );
        } else if (status == 'failed') {
          timer.cancel();
          setState(() {
            _status = 'Generation Failed';
          });
          // Update status in Firestore
          await DatabaseService.updateGenerationStatus(widget.videoId, 'failed');
        } else {
          setState(() {
            _status = 'Generating Video... ($status)';
          });
        }
      } catch (e) {
        debugPrint('Error polling status: $e');
      }
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: _isReady && _dialogue != null && _videoUrl != null
          ? PodcastPlayer(
              dialogueId: widget.videoId,
              dialogue: _dialogue!,
              videoUrl: _videoUrl!,
              onJudgeRequested: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => JudgeScreen(
                      dialogueId: widget.videoId,
                      p1: _p1 ?? 'P1',
                      p2: _p2 ?? 'P2',
                      script: _dialogue!.script,
                    ),
                  ),
                );
              },
            )
          : Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SpinKitCubeGrid(color: Colors.orange, size: 80),
                      const SizedBox(height: 40),
                      Text(
                        _status,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 16),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 40),
                        child: Text(
                          'HeyGen is currently animating the philosophers. This usually takes 1-3 minutes.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.white60, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: 60,
                  left: 20,
                  child: CircleAvatar(
                    backgroundColor: Colors.black.withOpacity(0.5),
                    child: IconButton(
                      icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
