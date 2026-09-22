import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class DatabaseService {
  static final FirebaseFirestore _db = FirebaseFirestore.instanceFor(
    databaseId: 'ai-studio-2fbc970c-8e11-4146-8b10-f39ea73256c1',
  );

  static Future<void> saveGeneration({
    required String id,
    required String p1,
    required String p2,
    required String topic,
    required String language,
    String? videoUrl,
    required String status,
    bool isPublic = false,
    List<Map<String, dynamic>>? script,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    await _db.collection('generations').doc(id).set({
      'id': id,
      'p1_id': p1,
      'p2_id': p2,
      'topic': topic,
      'language': language,
      'video_url': videoUrl,
      'status': status,
      'isPublic': isPublic,
      'script': script,
      'videoFormat': videoFormat,
      'createdAt': FieldValue.serverTimestamp(),
      'userId': user.uid,
      'userEmail': user.email,
    });
  }

  static Stream<List<Map<String, dynamic>>> getUserGenerations() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return Stream.value([]);

    return _db
        .collection('generations')
        .where('userId', isEqualTo: user.uid)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  static Future<void> updateGenerationStatus(String id, String status, {String? videoUrl}) async {
    final data = <String, dynamic>{
      'status': status,
    };
    if (videoUrl != null) {
      data['video_url'] = videoUrl;
    }
    await _db.collection('generations').doc(id).update(data);
  }

  static Future<void> saveInterviewMessage({
    required String interviewId,
    required String philosopherId,
    required String role,
    required String text,
    String? audioUrl,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final docRef = _db.collection('interviews').doc(interviewId);
    
    // Ensure interview document exists
    await docRef.set({
      'userId': user.uid,
      'philosopherId': philosopherId,
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    // Add message to subcollection
    await docRef.collection('messages').add({
      'role': role,
      'text': text,
      'audioUrl': audioUrl,
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  static Stream<List<Map<String, dynamic>>> getInterviewMessages(String interviewId) {
    return _db
        .collection('interviews')
        .doc(interviewId)
        .collection('messages')
        .orderBy('timestamp', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  static Future<void> saveAvatarConfig({
    required String philosopherId,
    required Map<String, dynamic> config,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    await _db.collection('avatars').doc('${user.uid}_$philosopherId').set({
      'userId': user.uid,
      'philosopherId': philosopherId,
      'config': config,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  static Future<Map<String, dynamic>?> getGeneration(String id) async {
    final doc = await _db.collection('generations').doc(id).get();
    return doc.data();
  }

  static Future<void> saveDebateAnalysis({
    required String dialogueId,
    required String judgeId,
    required Map<String, int> scores,
    required Map<String, String> evaluation,
    required String winnerId,
    required String summary,
  }) async {
    await _db.collection('debate_analysis').doc(dialogueId).set({
      'dialogueId': dialogueId,
      'judgeId': judgeId,
      'scores': scores,
      'evaluation': evaluation,
      'winnerId': winnerId,
      'summary': summary,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  static Stream<List<Map<String, dynamic>>> getPublicGenerations() {
    return _db
        .collection('generations')
        .where('isPublic', isEqualTo: true)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  static Future<void> togglePublicStatus(String id, bool isPublic) async {
    await _db.collection('generations').doc(id).update({
      'isPublic': isPublic,
    });
  }
