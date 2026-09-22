import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../models/dialogue.dart';

class AIService {
  // Use the API key from the environment
  static const String _apiKey = String.fromEnvironment('GEMINI_API_KEY');

  static GenerativeModel _getModel(String modelName) {
    if (_apiKey.isEmpty) {
      debugPrint('WARNING: GEMINI_API_KEY is not set in the environment.');
    }
    return GenerativeModel(
      model: modelName,
      apiKey: _apiKey,
    );
  }

  /// 1. Generate Philosophical Dialogue
  static Future<List<DialogueLine>> generateDialogue({
    required String p1,
    required String p2,
    required String topic,
    required String language,
    String? p1Desc,
    String? p2Desc,
  }) async {
    final model = _getModel('gemini-3.1-pro-preview');

    final prompt = """
    Create a deep, comprehensive philosophical dialogue between $p1 and $p2.
    ${p1Desc != null ? '$p1 description: $p1Desc' : ''}
    ${p2Desc != null ? '$p2 description: $p2Desc' : ''}
    Topic: $topic
    Language: $language

    The dialogue should be a rigorous intellectual exchange, exploring different facets of the topic.
    Format the output strictly as a JSON array of objects:
    [
      {"speaker": "$p1", "text": "...", "duration": 5.0},
      {"speaker": "$p2", "text": "...", "duration": 6.5}
    ]
    Estimate the 'duration' in seconds based on the length of the text (roughly 2.5 words per second).
    Return ONLY the JSON array, no markdown formatting, no other text.
    """;

    final response = await model.generateContent([Content.text(prompt)]);
    return _parseDialogueResponse(response.text);
  }

  /// 2. Live Interview Mode - Generate Response
  static Future<String> generateInterviewResponse({
    required String philosopher,
    required String userMessage,
    required List<Map<String, String>> chatHistory,
    required String language,
  }) async {
    final model = _getModel('gemini-3.1-pro-preview');

    // Build context from history
    String historyContext = chatHistory.map((msg) {
      return "${msg['role'] == 'user' ? 'Interviewer' : philosopher}: ${msg['text']}";
    }).join('\n');

    final prompt = """
    You are the philosopher $philosopher. You are participating in a live interview.
    Respond to the interviewer's latest question in character, using your known philosophical frameworks, tone, and vocabulary.
    Language: $language

    Previous conversation:
    $historyContext

    Interviewer: $userMessage
    $philosopher:
    """;

    final response = await model.generateContent([Content.text(prompt)]);
    return response.text?.trim() ?? "I have nothing more to say on this matter.";
  }

  /// 3. AI Judge - Analyze Debate
  static Future<Map<String, dynamic>> analyzeDebate({
    required String judgePhilosopher,
    required String p1,
    required String p2,
    required List<DialogueLine> script,
    required String language,
  }) async {
    final model = _getModel('gemini-3.1-pro-preview');

    String debateText = script.map((line) => "${line.speaker}: ${line.text}").join('\n');

    final prompt = """
    You are $judgePhilosopher. You have just witnessed a debate between $p1 and $p2.
    Analyze their arguments based on logic, persuasion, depth, and emotion.
    Language: $language

    Debate Transcript:
    $debateText

    Provide your analysis strictly as a JSON object with the following structure:
    {
      "scores": {
        "p1_score": 85,
        "p2_score": 90
      },
      "evaluation": {
        "logic": "Analysis of their logical consistency...",
        "arguments": "Analysis of the strength of their arguments...",
        "persuasion": "Who was more persuasive and why...",
        "depth": "Did they reach the core of the philosophical issue?",
        "emotion": "How did passion and rhetoric play a role?"
      },
      "winnerId": "Name of the winner (or 'Tie')",
      "summary": "Your overall concluding thoughts as $judgePhilosopher."
    }
    Return ONLY the JSON object, no markdown formatting.
    """;

    final response = await model.generateContent([Content.text(prompt)]);
    final text = response.text;

    if (text == null) throw Exception('Failed to generate analysis');

    try {
      String cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
      }
      return jsonDecode(cleanedText);
    } catch (e) {
      debugPrint('Error parsing analysis JSON: $e');
      throw Exception('Failed to parse AI Judge analysis');
    }
  }

  /// 4. Book Debate Mode - Generate Summary & Debate
  static Future<Map<String, dynamic>> generateBookDebate({
    required String p1,
    required String p2,
    required String bookTitle,
    String? bookAuthor,
    required String language,
  }) async {
    final model = _getModel('gemini-3.1-pro-preview');

    final prompt = """
    Create a philosophical debate between $p1 and $p2 discussing the book "$bookTitle" ${bookAuthor != null ? 'by $bookAuthor' : ''}.
    Language: $language

    First, provide a brief summary of the book's core themes.
    Then, generate a deep dialogue where the two philosophers debate the book's ideas from their respective philosophical viewpoints.

    Format the output strictly as a JSON object:
    {
      "book_summary": "A brief summary of the book's core themes...",
      "dialogue": [
        {"speaker": "$p1", "text": "...", "duration": 5.0},
        {"speaker": "$p2", "text": "...", "duration": 6.5}
      ]
    }
    Estimate the 'duration' in seconds based on the length of the text (roughly 2.5 words per second).
    Return ONLY the JSON object, no markdown formatting.
    """;

    final response = await model.generateContent([Content.text(prompt)]);
    final text = response.text;

    if (text == null) throw Exception('Failed to generate book debate');

    try {
      String cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
      }
      
      final Map<String, dynamic> decoded = jsonDecode(cleanedText);
      
      // Convert dialogue list to DialogueLine objects
      final List<dynamic> rawDialogue = decoded['dialogue'] ?? [];
      final List<DialogueLine> script = rawDialogue.map((e) {
        return DialogueLine(
          speaker: e['speaker'] ?? '',
          text: e['text'] ?? '',
          startTime: 0.0, // Will be calculated later
          duration: (e['duration'] ?? 5.0).toDouble(),
        );
      }).toList();

      return {
        'summary': decoded['book_summary'] ?? '',
        'script': script,
      };
    } catch (e) {
      debugPrint('Error parsing book debate JSON: $e');
      throw Exception('Failed to parse book debate');
    }
  }

  // Helper to parse dialogue JSON array
  static List<DialogueLine> _parseDialogueResponse(String? text) {
    if (text == null) throw Exception('Failed to generate dialogue');

    try {
      String cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
      }

      final List<dynamic> decoded = jsonDecode(cleanedText);
      double currentStartTime = 0.0;
      
      return decoded.map((e) {
        final duration = (e['duration'] ?? 5.0).toDouble();
        final line = DialogueLine(
          speaker: e['speaker'] ?? '',
          text: e['text'] ?? '',
          startTime: currentStartTime,
          duration: duration,
        );
        currentStartTime += duration; // Calculate sequential start times
        return line;
      }).toList();
    } catch (e) {
      debugPrint('Error parsing dialogue JSON: $e');
      throw Exception('Failed to parse dialogue');
    }
  }
}
