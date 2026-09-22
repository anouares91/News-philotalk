import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../models/dialogue.dart';

class AudioService {
  static const String _apiKey = String.fromEnvironment('GEMINI_API_KEY');

  static GenerativeModel _getTtsModel() {
    return GenerativeModel(
      model: 'gemini-2.5-flash-preview-tts',
      apiKey: _apiKey,
    );
  }

  /// Generate TTS for a single line (Useful for Live Interview Mode)
  static Future<Uint8List?> generateSpeech({
    required String text,
    required String speakerName,
    required String voiceName, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
  }) async {
    final model = _getTtsModel();

    final prompt = "Say as $speakerName: $text";

    // Note: The google_generative_ai package in Dart might not fully support 
    // the speechConfig parameter yet in its stable release, but we structure it 
    // according to the Gemini API specs.
    // We will use the standard generateContent and extract the inlineData.
    
    try {
      final response = await model.generateContent([
        Content.text(prompt)
      ]);

      // In a full implementation with the latest SDK supporting responseModalities:
      // We would extract the audio bytes from the response.
      // For now, we simulate returning audio bytes if the SDK doesn't expose it directly yet.
      
      // Example extraction (pseudo-code depending on SDK version):
      // final audioPart = response.candidates.first.content.parts.firstWhere((p) => p is InlineDataPart);
      // return base64Decode((audioPart as InlineDataPart).data);
      
      debugPrint("TTS generated for $speakerName");
      return Uint8List(0); // Placeholder for actual audio bytes
    } catch (e) {
      debugPrint("Error generating speech: $e");
      return null;
    }
  }

  /// Generate TTS for an entire dialogue (Multi-speaker)
  static Future<Uint8List?> generateDialogueAudio({
    required List<DialogueLine> script,
    required String p1Voice,
    required String p2Voice,
  }) async {
    final model = _getTtsModel();

    String prompt = "TTS the following conversation:\n";
    for (var line in script) {
      prompt += "${line.speaker}: ${line.text}\n";
    }

    try {
      final response = await model.generateContent([
        Content.text(prompt)
      ]);
      
      debugPrint("Multi-speaker TTS generated");
      return Uint8List(0); // Placeholder for actual audio bytes
    } catch (e) {
      debugPrint("Error generating dialogue audio: $e");
      return null;
    }
  }

  // --- AMBIENT SOUND MIXER (Structure) ---
  
  // In a real implementation, we would use audioplayers or just_audio
  // final AudioPlayer _voicePlayer = AudioPlayer();
  // final AudioPlayer _ambientPlayer = AudioPlayer();
  // final AudioPlayer _musicPlayer = AudioPlayer();

  static Future<void> playAmbientSound(String type) async {
    // String assetPath = '';
    // switch (type) {
    //   case 'cafe': assetPath = 'assets/audio/cafe.mp3'; break;
    //   case 'rain': assetPath = 'assets/audio/rain.mp3'; break;
    //   case 'library': assetPath = 'assets/audio/library.mp3'; break;
    // }
    // await _ambientPlayer.setSourceAsset(assetPath);
    // await _ambientPlayer.setVolume(0.3);
    // await _ambientPlayer.setReleaseMode(ReleaseMode.loop);
    // await _ambientPlayer.resume();
    debugPrint("Playing ambient sound: $type");
  }

  static Future<void> stopAmbientSound() async {
    // await _ambientPlayer.stop();
    debugPrint("Stopped ambient sound");
  }
}
