import 'dart:convert';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:flutter/foundation.dart';

class GeminiService {
  // The API key is injected by the platform at runtime.
  // We should use a placeholder or read it from environment if possible.
  // In Flutter, we might need to pass it from the server or use a specific env var.
  // The instructions say "Always call Gemini API from the frontend code".
  // "The Gemini API key is already set in the environment."
  // In Flutter, we can try to access it via String.fromEnvironment or similar.
  
  static const String _apiKey = String.fromEnvironment('GEMINI_API_KEY');

  static Future<List<Map<String, String>>> generateDialogue({
    required String p1,
    required String p2,
    required String topic,
    required String language,
  }) async {
    if (_apiKey.isEmpty) {
      debugPrint('GEMINI_API_KEY is not set in the environment.');
      // For demo purposes, if key is missing, return a dummy dialogue
      return [
        {"speaker": p1, "text": "Greetings, my friend. What is your take on $topic?"},
        {"speaker": p2, "text": "It is a complex matter, indeed. I believe it is the foundation of our existence."},
        {"speaker": p1, "text": "But how can we be sure of its nature?"},
        {"speaker": p2, "text": "Through rigorous questioning and logic, of course."},
      ];
    }

    final model = GenerativeModel(
      model: 'gemini-3-flash-preview',
      apiKey: _apiKey,
    );

    final prompt = """
    Create a philosophical dialogue between $p1 and $p2 about $topic.
    The dialogue should be in ${language == 'ar' ? 'Arabic' : 'English'}.
    Format the output as a JSON list of objects: [{"speaker": "$p1", "text": "..."}, {"speaker": "$p2", "text": "..."}]
    Keep it to exactly 4 exchanges total.
    Only return the JSON list, nothing else.
    """;

    final response = await model.generateContent([Content.text(prompt)]);
    final text = response.text;

    if (text == null) {
      throw Exception('Failed to generate dialogue');
    }

    try {
      // Clean the response text if it contains markdown code blocks
      String cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
      }

      final List<dynamic> decoded = jsonDecode(cleanedText);
      return decoded.map((e) => Map<String, String>.from(e)).toList();
    } catch (e) {
      debugPrint('Error parsing dialogue: $e');
      throw Exception('Failed to parse dialogue');
    }
  }
}
