import 'dart:async';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/dialogue.dart';
import '../services/database_service.dart';

class PodcastPlayer extends StatefulWidget {
  final String dialogueId;
  final Dialogue dialogue;
  final String videoUrl;
  final VoidCallback? onJudgeRequested;

  const PodcastPlayer({
    Key? key,
    required this.dialogueId,
    required this.dialogue,
    required this.videoUrl,
    this.onJudgeRequested,
  }) : super(key: key);

  @override
  State<PodcastPlayer> createState() => _PodcastPlayerState();
}

class _PodcastPlayerState extends State<PodcastPlayer> {
  late VideoPlayerController _controller;
  bool _isPlaying = false;
  bool _showControls = true;
  Timer? _hideTimer;
  double _currentPosition = 0;
  double _totalDuration = 1;

  bool _showScript = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl))
      ..initialize().then((_) {
        setState(() {
          _totalDuration = _controller.value.duration.inMilliseconds.toDouble();
        });
        _controller.play();
        _isPlaying = true;
        _startHideTimer();
      });

    _controller.addListener(() {
      if (mounted) {
        setState(() {
          _currentPosition = _controller.value.position.inMilliseconds.toDouble();
          if (_controller.value.isPlaying != _isPlaying) {
            _isPlaying = _controller.value.isPlaying;
          }
        });
      }
    });
  }

  void _startHideTimer() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && _isPlaying) {
        setState(() {
          _showControls = false;
        });
      }
    });
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
    if (_showControls) {
      _startHideTimer();
    }
  }

  void _togglePlayPause() {
    setState(() {
      if (_isPlaying) {
        _controller.pause();
      } else {
        _controller.play();
      }
      _isPlaying = !_isPlaying;
    });
    _startHideTimer();
  }

  void _toggleScript() {
    setState(() {
      _showScript = !_showScript;
    });
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  DialogueLine? get _currentLine {
    final currentSec = _currentPosition / 1000.0;
    for (var line in widget.dialogue.script) {
      if (currentSec >= line.startTime && currentSec <= line.startTime + line.duration) {
        return line;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isPortrait = widget.dialogue.videoFormat == '9:16';
    final currentLine = _currentLine;

    return GestureDetector(
      onTap: _toggleControls,
      onDoubleTap: () {
        // Toggle fullscreen
        if (MediaQuery.of(context).orientation == Orientation.portrait) {
          // You would typically use SystemChrome here to force landscape
        }
      },
      child: Container(
        color: Colors.black,
        child: Stack(
          children: [
            // Video Layer
            Center(
              child: _controller.value.isInitialized
                  ? InteractiveViewer(
                      panEnabled: true,
                      minScale: 1.0,
                      maxScale: 4.0,
                      child: AspectRatio(
                        aspectRatio: _controller.value.aspectRatio,
                        child: VideoPlayer(_controller),
                      ),
                    )
                  : const CircularProgressIndicator(color: Colors.orange),
            ),

            // Subtitle Layer
            if (currentLine != null)
              Positioned(
                bottom: isPortrait ? MediaQuery.of(context).size.height * 0.4 : 100,
                left: 20,
                right: 20,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: Container(
                    key: ValueKey(currentLine.text),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white24, width: 1),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          currentLine.speaker,
                          style: TextStyle(
                            color: currentLine.speaker == widget.dialogue.p1Id ? Colors.orange : Colors.blue,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          currentLine.text,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Script Scroll Layer
            if (_showScript)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                height: MediaQuery.of(context).size.height * 0.4,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.85),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    border: Border.all(color: Colors.white10, width: 1),
                  ),
                  child: Column(
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 12, bottom: 8),
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          itemCount: widget.dialogue.script.length,
                          itemBuilder: (context, index) {
                            final line = widget.dialogue.script[index];
                            final isCurrent = currentLine == line;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isCurrent ? Colors.white.withOpacity(0.1) : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                                border: isCurrent ? Border.all(color: Colors.orange.withOpacity(0.5)) : null,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    line.speaker,
                                    style: TextStyle(
                                      color: line.speaker == widget.dialogue.p1Id ? Colors.orange : Colors.blue,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    line.text,
                                    style: TextStyle(
                                      color: isCurrent ? Colors.white : Colors.white70,
                                      fontSize: 16,
                                      height: 1.5,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Controls Layer
            AnimatedOpacity(
              opacity: _showControls && !_showScript ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 300),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.7),
                      Colors.transparent,
                      Colors.transparent,
                      Colors.black.withOpacity(0.9),
                    ],
                    stops: const [0.0, 0.2, 0.7, 1.0],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Top Bar
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
                              onPressed: () => Navigator.pop(context),
                            ),
                            Expanded(
                              child: Text(
                                widget.dialogue.topic,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.gavel, color: Colors.white),
                              onPressed: widget.onJudgeRequested,
                              tooltip: 'AI Judge',
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.share2, color: Colors.white),
                              onPressed: () async {
                                await DatabaseService.togglePublicStatus(widget.dialogueId, true);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Shared to Community!'),
                                      backgroundColor: Colors.orange,
                                    ),
                                  );
                                }
                              },
                              tooltip: 'Share to Community',
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.download, color: Colors.white),
                              onPressed: () {
                                // Download logic
                              },
                            ),
                            IconButton(
                              icon: Icon(_showScript ? LucideIcons.fileText : LucideIcons.fileText, color: _showScript ? Colors.orange : Colors.white),
                              onPressed: _toggleScript,
                            ),
                          ],
                        ),
                      ),

                      // Bottom Controls
                      Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Progress Bar
                            SliderTheme(
                              data: SliderThemeData(
                                trackHeight: 4,
                                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                                overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                                activeTrackColor: Colors.orange,
                                inactiveTrackColor: Colors.white24,
                                thumbColor: Colors.orange,
                              ),
                              child: Slider(
                                value: _currentPosition.clamp(0, _totalDuration),
                                min: 0,
                                max: _totalDuration > 0 ? _totalDuration : 1,
                                onChanged: (value) {
                                  _controller.seekTo(Duration(milliseconds: value.toInt()));
                                },
                              ),
                            ),
                            
                            // Buttons
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                IconButton(
                                  icon: const Icon(LucideIcons.skipBack, color: Colors.white),
                                  onPressed: () {
                                    _controller.seekTo(Duration(milliseconds: (_currentPosition - 10000).toInt()));
                                  },
                                ),
                                const SizedBox(width: 24),
                                GestureDetector(
                                  onTap: _togglePlayPause,
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: const BoxDecoration(
                                      color: Colors.orange,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      _isPlaying ? LucideIcons.pause : LucideIcons.play,
                                      color: Colors.white,
                                      size: 32,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 24),
                                IconButton(
                                  icon: const Icon(LucideIcons.skipForward, color: Colors.white),
                                  onPressed: () {
                                    _controller.seekTo(Duration(milliseconds: (_currentPosition + 10000).toInt()));
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
