class DialogueLine {
  final String speaker;
  final String text;
  final double startTime;
  final double duration;

  DialogueLine({
    required this.speaker,
    required this.text,
    required this.startTime,
    required this.duration,
  });

  factory DialogueLine.fromJson(Map<String, dynamic> json) {
    return DialogueLine(
      speaker: json['speaker'] ?? '',
      text: json['text'] ?? '',
      startTime: (json['start_time'] ?? 0).toDouble(),
      duration: (json['duration'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'speaker': speaker,
      'text': text,
      'start_time': startTime,
      'duration': duration,
    };
  }
}

class Dialogue {
  final String id;
  final String p1Id;
  final String p2Id;
  final String topic;
  final String language;
  final String status;
  final String videoFormat; // '16:9' or '9:16'
  final List<DialogueLine> script;
  final String? audioUrl;
  final String? videoUrl;

  Dialogue({
    required this.id,
    required this.p1Id,
    required this.p2Id,
    required this.topic,
    required this.language,
    required this.status,
    required this.videoFormat,
    required this.script,
    this.audioUrl,
    this.videoUrl,
  });

  factory Dialogue.fromJson(Map<String, dynamic> json) {
    return Dialogue(
      id: json['id'] ?? '',
      p1Id: json['p1_id'] ?? '',
      p2Id: json['p2_id'] ?? '',
      topic: json['topic'] ?? '',
      language: json['language'] ?? 'en',
      status: json['status'] ?? 'pending',
      videoFormat: json['videoFormat'] ?? '16:9',
      script: (json['script'] as List?)
              ?.map((e) => DialogueLine.fromJson(e))
              .toList() ??
          [],
      audioUrl: json['audio_url'],
      videoUrl: json['video_url'],
    );
  }
}
