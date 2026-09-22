import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:philosophy_ai_talk/models/dialogue.dart';
import 'package:philosophy_ai_talk/services/ai_service.dart';
import 'package:philosophy_ai_talk/services/database_service.dart';

class JudgeScreen extends StatefulWidget {
  final String dialogueId;
  final String p1;
  final String p2;
  final List<DialogueLine> script;

  const JudgeScreen({
    Key? key,
    required this.dialogueId,
    required this.p1,
    required this.p2,
    required this.script,
  }) : super(key: key);

  @override
  State<JudgeScreen> createState() => _JudgeScreenState();
}

class _JudgeScreenState extends State<JudgeScreen> {
  bool _isAnalyzing = true;
  Map<String, dynamic>? _analysis;
  String _selectedJudge = 'Marcus Aurelius';
  final List<String> _judges = ['Marcus Aurelius', 'Immanuel Kant', 'Bertrand Russell', 'Simone de Beauvoir'];

  @override
  void initState() {
    super.initState();
    _performAnalysis();
  }

  Future<void> _performAnalysis() async {
    setState(() => _isAnalyzing = true);
    try {
      final result = await AIService.analyzeDebate(
        judgePhilosopher: _selectedJudge,
        p1: widget.p1,
        p2: widget.p2,
        script: widget.script,
        language: 'en',
      );

      setState(() {
        _analysis = result;
        _isAnalyzing = false;
      });

      // Save analysis to Firestore
      await DatabaseService.saveDebateAnalysis(
        dialogueId: widget.dialogueId,
        judgeId: _selectedJudge,
        scores: Map<String, int>.from(scores),
        evaluation: Map<String, String>.from(evaluation),
        winnerId: winner.toString(),
        summary: summary.toString(),
      );
    } catch (e) {
      debugPrint('Error analyzing debate: $e');
      if (mounted) {
        setState(() => _isAnalyzing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to analyze debate: $e')),
        );
      }
    }
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
        title: const Text(
          'AI Judge Analysis',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isAnalyzing ? _buildLoadingState() : _buildAnalysisContent(),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 60,
            height: 60,
            child: CircularProgressIndicator(color: Colors.green, strokeWidth: 4),
          ),
          const SizedBox(height: 30),
          Text(
            '$_selectedJudge is evaluating...',
            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Analyzing logic, depth, and persuasion.',
            style: TextStyle(color: Colors.white54, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisContent() {
    if (_analysis == null) return const Center(child: Text('No analysis available.'));

    final scores = _analysis!['scores'];
    final evaluation = _analysis!['evaluation'];
    final winner = _analysis!['winnerId'];
    final summary = _analysis!['summary'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Winner Announcement
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.green.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                const Icon(LucideIcons.trophy, color: Colors.yellow, size: 48),
                const SizedBox(height: 16),
                const Text('THE WINNER IS', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 2)),
                const SizedBox(height: 8),
                Text(
                  winner.toString().toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 40),
          
          // Scores
          Row(
            children: [
              _buildScoreCard(widget.p1, scores['p1_score'] ?? 0),
              const SizedBox(width: 16),
              _buildScoreCard(widget.p2, scores['p2_score'] ?? 0),
            ],
          ),
          
          const SizedBox(height: 40),
          
          // Detailed Evaluation
          _buildSectionHeader('Judge\'s Evaluation'),
          const SizedBox(height: 20),
          _buildEvaluationItem('Logic & Consistency', evaluation['logic']),
          _buildEvaluationItem('Argument Strength', evaluation['arguments']),
          _buildEvaluationItem('Persuasion', evaluation['persuasion']),
          _buildEvaluationItem('Philosophical Depth', evaluation['depth']),
          _buildEvaluationItem('Emotional Impact', evaluation['emotion']),
          
          const SizedBox(height: 40),
          
          // Summary
          _buildSectionHeader('Final Verdict'),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
              fontStyle: FontStyle.italic,
            ),
            child: Text(
              '"$summary"',
              style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.6),
            ),
          ),
          
          const SizedBox(height: 60),
          
          // Change Judge
          Center(
            child: TextButton(
              onPressed: _showJudgePicker,
              child: const Text('Change Judge', style: TextStyle(color: Colors.orange)),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildScoreCard(String name, dynamic score) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Column(
          children: [
            Text(name, style: const TextStyle(color: Colors.white54, fontSize: 12), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              score.toString(),
              style: const TextStyle(color: Colors.orange, fontSize: 32, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildEvaluationItem(String title, dynamic content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.orange, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            content?.toString() ?? 'No analysis provided.',
            style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
          ),
        ],
      ),
    );
  }

  void _showJudgePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Select AI Judge', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              ..._judges.map((j) => ListTile(
                title: Text(j, style: TextStyle(color: j == _selectedJudge ? Colors.orange : Colors.white)),
                onTap: () {
                  setState(() => _selectedJudge = j);
                  Navigator.pop(context);
                  _performAnalysis();
                },
              )).toList(),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }
}
