# PhiloTalk - AI Philosophical Podcast Platform
## System Architecture & Design Document

### 1. FLUTTER APP STRUCTURE (`lib/`)
A clean, production-ready scalable architecture using feature-first or layer-first organization.

```text
lib/
├── main.dart
├── core/
│   ├── theme/ (Dark philosophical theme, colors, typography)
│   ├── constants/ (API keys, asset paths)
│   └── utils/ (Audio sync math, formatters)
├── models/
│   ├── philosopher.dart
│   ├── dialogue.dart
│   ├── avatar_config.dart
│   ├── interview_message.dart
│   └── debate_analysis.dart
├── services/
│   ├── ai_service.dart (Gemini API integration for Dialogue, Judge, Book AI)
│   ├── audio_service.dart (TTS generation, Ambient sound mixer)
│   ├── video_service.dart (FFmpeg/Native rendering for MP4 export)
│   ├── firebase_service.dart (Firestore CRUD operations)
│   └── avatar_service.dart (Audio-reactive animation logic)
├── providers/ (State Management - Riverpod / Provider)
│   ├── podcast_provider.dart
│   ├── interview_provider.dart
│   └── avatar_provider.dart
├── screens/
│   ├── home_screen.dart
│   ├── philosopher_select_screen.dart
│   ├── avatar_customizer_screen.dart
│   ├── dialogue_screen.dart
│   ├── video_screen.dart (Podcast Player)
│   ├── book_debate_screen.dart
│   └── interview_screen.dart (Live Mode)
└── widgets/
    ├── podcast_player.dart (Video/Audio player with auto-hide controls)
    ├── avatar_view.dart (Audio-reactive animated avatar)
    ├── subtitle_view.dart (Synced animated text)
    ├── control_bar.dart
    └── dialogue_list.dart (Scrollable script)
```

### 2. FIREBASE STRUCTURE (Firestore)

```javascript
// Collections & Documents
/users/{userId}
  - displayName, email, plan, language, createdAt

/philosophers/{philosopherId}
  - name, bio, core_beliefs, default_avatar_ref

/avatars/{avatarId}
  - userId, philosopherId, background, clothes, microphone, lighting, camera_style

/dialogues/{dialogueId}
  - p1_id, p2_id, topic, language, status, videoFormat (16:9 or 9:16)
  - script: [{speaker, text, duration, start_time}]
  - audio_url, video_url, created_at

/interviews/{interviewId}
  - userId, philosopherId, topic, created_at
  - messages: [{role: "user"|"ai", text: string, audio_url: string, timestamp}]

/debate_analysis/{analysisId}
  - dialogueId, judge_philosopher_id
  - scores: {p1_score: int, p2_score: int}
  - evaluation: {logic, arguments, persuasion, depth, emotion}
  - winner_id, summary_text

/books/{bookId}
  - title, author, summary, core_themes
```

### 3. AI PIPELINE & SERVICES

1. **Dialogue AI**: Uses Gemini 3.1 Pro for deep, context-aware philosophical debates.
2. **Voice AI (TTS)**: Uses Gemini TTS (or Google Cloud TTS) to generate distinct voices for each philosopher.
3. **Judge AI**: A specialized prompt evaluating the generated `dialogueId` script based on logic and persuasion, outputting JSON scores.
4. **Translation AI**: Translates prompts and outputs to Arabic, English, Spanish, or French while maintaining philosophical tone.
5. **Book AI**: Summarizes a selected book and extracts debate points for the philosophers.

### 4. VIDEO GENERATION PIPELINE

1. **Script Generation**: AI generates the dialogue array.
2. **Audio Generation**: TTS generates audio for each line.
3. **Subtitle Timing**: Calculate `start_time` and `duration` for each line based on audio length.
4. **Scene Composition**: 
   - *Landscape (16:9)*: P1 left, P2 right.
   - *Portrait (9:16)*: P1 top, P2 bottom. Subtitles center.
5. **Avatar Animation**: Audio-reactive scaling and sound waves applied to the avatar widget.
6. **Rendering**: Use a Flutter rendering package (like `export_video` or FFmpeg via `ffmpeg_kit_flutter`) to capture the widget tree + audio into an MP4 file.

### 5. AUDIO SYNC & REACTIVE AVATAR LOGIC

**Flutter Implementation:**
- Use `audioplayers` or `just_audio` to play the TTS output.
- Use an audio spectrum analyzer plugin (e.g., `audio_waveforms` or native platform channels) to get real-time decibel (dB) levels.
- **AvatarView Widget**: 
  - Listens to the dB stream.
  - `Transform.scale`: Scales the avatar image slightly (e.g., 1.0 to 1.05) based on volume.
  - `CustomPaint`: Draws dynamic sound waves around the avatar based on frequency data.
  - *Lip Sync*: If advanced lip-sync is needed, map dB thresholds to 3-4 mouth states (closed, slightly open, wide open).

### 6. AMBIENT SOUND SYSTEM

**Flutter Audio Mixer:**
- Initialize multiple audio players simultaneously.
- Player 1: Voice (Main TTS) - Volume 1.0
- Player 2: Ambient (Cafe, Rain, Library) - Volume 0.3 (Looping)
- Player 3: Background Music (Philosophical strings) - Volume 0.1 (Looping)
- The `VideoScreen` controls the master mix.

### 7. PODCAST PLAYER SYSTEM

**UI Layout (`VideoScreen`):**
- **Stack Widget**:
  - Layer 1: Background (Studio/Ambient image).
  - Layer 2: Avatars (Positioned based on 16:9 or 9:16 format).
  - Layer 3: SubtitleView (Animated text using `AnimatedSwitcher`).
  - Layer 4: ControlBar (Play/Pause, Timeline, Volume).
- **Auto-hide Logic**: 
  - A `Timer` resets on user tap/interaction. After 3 seconds, `Opacity` widget fades out the ControlBar.
- **Script Scroll**: 
  - A `DraggableScrollableSheet` or a bottom panel that expands to show the full `ListView` of the dialogue. Highlights the currently spoken line.
