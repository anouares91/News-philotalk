import 'dart:math';
import 'package:flutter/material.dart';

class AvatarView extends StatefulWidget {
  final String imageUrl;
  final double audioVolume; // 0.0 to 1.0
  final bool isSpeaking;
  final Color waveColor;

  const AvatarView({
    Key? key,
    required this.imageUrl,
    this.audioVolume = 0.0,
    this.isSpeaking = false,
    this.waveColor = Colors.orange,
  }) : super(key: key);

  @override
  State<AvatarView> createState() => _AvatarViewState();
}

class _AvatarViewState extends State<AvatarView> with SingleTickerProviderStateMixin {
  late AnimationController _waveController;

  @override
  void initState() {
    super.initState();
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _waveController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Base scale is 1.0, max scale is 1.15 based on volume
    final scale = 1.0 + (widget.audioVolume * 0.15);
    
    return Stack(
      alignment: Alignment.center,
      children: [
        // Sound Waves
        if (widget.isSpeaking)
          AnimatedBuilder(
            animation: _waveController,
            builder: (context, child) {
              return CustomPaint(
                painter: _SoundWavePainter(
                  progress: _waveController.value,
                  volume: widget.audioVolume,
                  color: widget.waveColor,
                ),
                size: const Size(200, 200),
              );
            },
          ),

        // Avatar Image
        AnimatedContainer(
          duration: const Duration(milliseconds: 100),
          transform: Matrix4.identity()..scale(scale, scale),
          transformAlignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: widget.isSpeaking ? widget.waveColor : Colors.white10,
              width: 4,
            ),
            boxShadow: widget.isSpeaking
                ? [
                    BoxShadow(
                      color: widget.waveColor.withOpacity(0.5 * widget.audioVolume),
                      blurRadius: 20 * widget.audioVolume,
                      spreadRadius: 5 * widget.audioVolume,
                    )
                  ]
                : [],
          ),
          child: ClipOval(
            child: Image.network(
              widget.imageUrl,
              width: 150,
              height: 150,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 150,
                  height: 150,
                  color: Colors.grey[900],
                  child: const Icon(Icons.person, size: 80, color: Colors.white54),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _SoundWavePainter extends CustomPainter {
  final double progress;
  final double volume;
  final Color color;

  _SoundWavePainter({
    required this.progress,
    required this.volume,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (volume <= 0.05) return; // Don't draw if volume is too low

    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = min(size.width, size.height) / 2;
    final baseRadius = 75.0; // Matches half of the avatar width (150/2)

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    // Draw 3 expanding rings
    for (int i = 0; i < 3; i++) {
      // Offset progress for each ring so they expand sequentially
      double ringProgress = (progress + (i * 0.33)) % 1.0;
      
      // Radius expands from baseRadius to maxRadius based on volume
      double currentRadius = baseRadius + (maxRadius - baseRadius) * ringProgress * (0.5 + volume * 0.5);
      
      // Opacity fades out as it expands, and is multiplied by volume
      double opacity = (1.0 - ringProgress) * volume;
      
      paint.color = color.withOpacity(opacity.clamp(0.0, 1.0));
      
      canvas.drawCircle(center, currentRadius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SoundWavePainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.volume != volume;
  }
}
