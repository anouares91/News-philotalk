import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) {
      // Use the current origin in web to avoid hardcoded URLs
      return '${Uri.base.origin}/api';
    }
    // Fallback for other platforms
    return 'https://ais-dev-y3cgh4qtzp4f4fvlrzfcl4-139068813026.europe-west3.run.app/api';
  }

  static Future<Map<String, dynamic>> generateVideo({
    required List<Map<String, String>> dialogue,
    required String philosopher1,
    required String philosopher2,
    required String language,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/video/generate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'dialogue': dialogue,
        'philosopher1': philosopher1,
        'philosopher2': philosopher2,
        'language': language,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to generate video: ${response.body}');
    }
  }

  static Future<List<dynamic>> getUserVideos(String uid) async {
    final response = await http.get(Uri.parse('$baseUrl/videos/$uid'));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['videos'];
    } else {
      throw Exception('Failed to fetch videos');
    }
  }

  static Future<List<dynamic>> getTopics() async {
    final response = await http.get(Uri.parse('$baseUrl/topics'));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch topics');
    }
  }

  static Future<Map<String, dynamic>> getVideoStatus(String videoId) async {
    final response = await http.get(Uri.parse('$baseUrl/video/status/$videoId'));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch video status');
    }
  }
}
