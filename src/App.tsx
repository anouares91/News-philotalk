import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  MessageSquare, 
  Play, 
  User as UserIcon, 
  Users,
  Settings, 
  Plus, 
  Sparkles, 
  History,
  ArrowRight,
  Loader2,
  Video as VideoIcon,
  ChevronLeft,
  ChevronRight,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  CreditCard,
  HelpCircle,
  LogOut,
  ArrowLeft,
  Volume2,
  VolumeX,
  Music,
  Download,
  Share2,
  Trash2,
  Globe,
  Copy,
  Search,
  Brain,
  FileText,
  FileAudio,
  MessageSquare as MessageSquareIcon,
  Check,
  BookOpen,
  Maximize,
  ChevronDown,
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import { cn } from "./lib/utils";
import { openDB } from 'idb';
import { useParams } from 'react-router-dom';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  increment,
  User as FirebaseUser,
  OperationType,
  handleFirestoreError
} from "./firebase";
import { Toaster, toast } from 'sonner';

// --- Language Context ---
type Language = 'en' | 'ar' | 'fr' | 'de' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
    fr: string;
    de: string;
    es: string;
  };
}

const translations: Translations = {
  // Navbar
  nav_home: { en: "Home", ar: "الرئيسية", fr: "Accueil", de: "Startseite", es: "Inicio" },
  nav_feed: { en: "Community", ar: "المجتمع", fr: "Communauté", de: "Community", es: "Comunidad" },
  nav_history: { en: "History", ar: "السجل", fr: "Historique", de: "Verlauf", es: "Historial" },
  nav_profile: { en: "Profile", ar: "الملف الشخصي", fr: "Profil", de: "Profil", es: "Perfil" },
  
  // Header
  header_community: { en: "Community Feed", ar: "خلاصة المجتمع", fr: "Fil de la Communauté", de: "Community-Feed", es: "Feed de la Comunidad" },
  community_tab_dialogues: { en: "Dialogues", ar: "الحوارات", fr: "Dialogues", de: "Dialoge", es: "Diálogos" },
  community_tab_books: { en: "Book Library", ar: "مكتبة الكتب", fr: "Bibliothèque", de: "Buchbibliothek", es: "Biblioteca de Libros" },
  header_history: { en: "History", ar: "السجل", fr: "Historique", de: "Verlauf", es: "Historial" },
  header_profile: { en: "Profile", ar: "الملف الشخصي", fr: "Profil", de: "Profil", es: "Perfil" },
  header_liked: { en: "Liked Dialogues", ar: "الحوارات المعجب بها", fr: "Dialogues Aimés", de: "Gelikte Dialoge", es: "Diálogos que me gustan" },
  header_subscription: { en: "Subscription", ar: "الاشتراك", fr: "Abonnement", de: "Abonnement", es: "Suscripción" },
  header_help: { en: "Help & Support", ar: "المساعدة والدعم", fr: "Aide et Support", de: "Hilfe & Support", es: "Ayuda y Soporte" },
  header_new_dialogue: { en: "New Dialogue", ar: "حوار جديد", fr: "Nouveau Dialogue", de: "Neuer Dialog", es: "Nuevo Diálogo" },
  
  // Home
  home_generate_title: { en: "Generate New Dialogue", ar: "توليد حوار جديد", fr: "Générer un Nouveau Dialogue", de: "Neuen Dialog generieren", es: "Generar Nuevo Diálogo" },
  home_generate_desc: { en: "Create a cinematic philosophical conversation between two masters", ar: "أنشئ محادثة فلسفية سينمائية بين اثنين من المعلمين", fr: "Créez une conversation philosophique cinématographique entre deux maîtres", de: "Erstellen Sie ein kinoreifes philosophisches Gespräch zwischen zwei Meistern", es: "Crea una conversación filosófica cinematográfica entre dos maestros" },
  home_start_now: { en: "Start Now", ar: "ابدأ الآن", fr: "Commencer Maintenant", de: "Jetzt starten", es: "Empezar Ahora" },
  choose_generation_mode: { en: "What would you like to create?", ar: "ماذا تود أن تنشئ؟", fr: "Que souhaitez-vous créer ?", de: "Was möchten Sie erstellen?", es: "¿Qué te gustaría crear?" },
  mode_dialogue: { en: "Philosophical Dialogue", ar: "حوار فلسفي", fr: "Dialogue Philosophique", de: "Philosophischer Dialog", es: "Diálogo Filosófico" },
  mode_dialogue_desc: { en: "Create a debate between two great minds on any topic.", ar: "أنشئ مناظرة بين عقلين عظيمين حول أي موضوع.", fr: "Créez un débat entre deux grands esprits sur n'importe quel sujet.", de: "Erstellen Sie eine Debatte zwischen zwei großen Geistern zu jedem Thema.", es: "Crea un debate entre dos grandes mentes sobre cualquier tema." },
  mode_book_summary: { en: "Book Summary", ar: "تلخيص كتاب", fr: "Résumé de Livre", de: "Buchzusammenfassung", es: "Resumen de Libro" },
  mode_book_summary_desc: { en: "Have two philosophers discuss and summarize a book.", ar: "اجعل فيلسوفين يناقشان ويلخصان كتاباً.", fr: "Faites discuter et résumer un livre par deux philosophes.", de: "Lassen Sie zwei Philosophen ein Buch diskutieren und zusammenfassen.", es: "Haz que dos filósofos discutan y resuman un libro." },
  mode_solo: { en: "Solo Voiceover", ar: "تعليق صوتي فردي", fr: "Voix Off Solo", de: "Solo-Voiceover", es: "Locución Solo" },
  mode_solo_desc: { en: "Generate a single-narrator script for a topic or book.", ar: "توليد نص لراوي واحد لموضوع أو كتاب.", fr: "Générez un script à narrateur unique pour un sujet ou un livre.", de: "Generieren Sie ein Skript mit einem Erzähler für ein Thema oder Buch.", es: "Genera un guion de un solo narrador para un tema o libro." },
  gen_solo_topic: { en: "What is your voiceover about?", ar: "عن ماذا يدور التعليق الصوتي؟", fr: "De quoi parle votre voix off ?", de: "Worum geht es in Ihrem Voiceover?", es: "¿De qué trata tu locución?" },
  gen_solo_topic_desc: { en: "Enter a topic or paste your script directly.", ar: "أدخل موضوعاً أو الصق نصك مباشرة.", fr: "Entrez un sujet ou collez votre script directement.", de: "Geben Sie ein Thema ein oder fügen Sie Ihr Skript direkt ein.", es: "Introduce un tema o pega tu guion directamente." },
  gen_solo_placeholder: { en: "Enter topic or paste script here...", ar: "أدخل الموضوع أو الصق النص هنا...", fr: "Entrez le sujet ou collez le script ici...", de: "Thema eingeben oder Skript hier einfügen...", es: "Introduce el tema o pega el guion aquí..." },
  error_topic_required: { en: "Please enter a topic or script", ar: "يرجى إدخال موضوع أو نص", fr: "Veuillez entrer un sujet ou un script", de: "Bitte geben Sie ein Thema oder Skript ein", es: "Por favor, introduce un tema o guion" },
  mode_style_dialogue: { en: "Dialogue (2 Speakers)", ar: "حوار (متحدثين)", fr: "Dialogue (2 Intervenants)", de: "Dialog (2 Sprecher)", es: "Diálogo (2 Oradores)" },
  mode_style_monologue: { en: "Monologue (1 Speaker)", ar: "مونولوج (متحدث واحد)", fr: "Monologue (1 Intervenant)", de: "Monolog (1 Sprecher)", es: "Monólogo (1 Orador)" },
  gen_book_title: { en: "Book Title", ar: "عنوان الكتاب", fr: "Titre du Livre", de: "Buchtitel", es: "Título del Libro" },
  gen_book_author: { en: "Author (Optional)", ar: "المؤلف (اختياري)", fr: "Auteur (Optionnel)", de: "Autor (Optional)", es: "Autor (Opcional)" },
  home_recent_dialogues: { en: "Recent Dialogues", ar: "الحوارات الأخيرة", fr: "Dialogues Récents", de: "Aktuelle Dialoge", es: "Diálogos Recientes" },
  home_view_all: { en: "View All", ar: "عرض الكل", fr: "Voir Tout", de: "Alle anzeigen", es: "Ver Todo" },
  home_no_dialogues: { en: "No dialogues generated yet", ar: "لم يتم توليد أي حوارات بعد", fr: "Aucun dialogue généré pour le moment", de: "Noch keine Dialoge generiert", es: "Aún no se han generado diálogos" },
  home_explore_philosophers: { en: "Explore Philosophers", ar: "استكشف الفلاسفة", fr: "Explorer les Philosophes", de: "Philosophen erkunden", es: "Explorar Filósofos" },
  
  // Generate
  gen_header: { en: "New Dialogue", ar: "حوار جديد", fr: "Nouveau Dialogue", de: "Neuer Dialog", es: "Nuevo Diálogo" },
  gen_step_1_title: { en: "Select First Philosopher", ar: "اختر الفيلسوف الأول", fr: "Sélectionner le Premier Philosophe", de: "Ersten Philosophen wählen", es: "Seleccionar Primer Filósofo" },
  gen_step_1_desc: { en: "Choose the first master for the dialogue.", ar: "اختر المعلم الأول للحوار.", fr: "Choisissez le premier maître pour le dialogue.", de: "Wählen Sie den ersten Meister für den Dialog.", es: "Elige al primer maestro para el diálogo." },
  gen_step_1_title_monologue: { en: "Select Narrator", ar: "اختر الراوي", fr: "Sélectionner le Narrateur", de: "Erzähler auswählen", es: "Seleccionar Narrador" },
  gen_step_1_desc_monologue: { en: "Choose the philosopher to narrate the summary.", ar: "اختر الفيلسوف ليروي التلخيص.", fr: "Choisissez le philosophe pour narrer le résumé.", de: "Wählen Sie den Philosophen, der die Zusammenfassung erzählt.", es: "Elige al filósofo para narrar el resumen." },
  gen_step_2_title: { en: "Select Second Philosopher", ar: "اختر الفيلسوف الثاني", fr: "Sélectionner le Second Philosophe", de: "Zweiten Philosophen wählen", es: "Seleccionar Segundo Filósofo" },
  gen_step_2_desc: { en: "Who will {p1} be debating with?", ar: "مع من سيناظر {p1}؟", fr: "Avec qui {p1} débattra-t-il ?", de: "Mit wem wird {p1} debattieren?", es: "¿Con quién debatirá {p1}?" },
  gen_step_3_title: { en: "Choose Voices", ar: "اختر الأصوات", fr: "Choisir les Voix", de: "Stimmen wählen", es: "Elegir Voces" },
  gen_step_3_desc: { en: "Customize how your philosophers sound.", ar: "خصص كيف يبدو صوت فلاسفتك.", fr: "Personnalisez le son de vos philosophes.", de: "Passen Sie den Klang Ihrer Philosophen an.", es: "Personaliza cómo suenan tus filósofos." },
  gen_step_4_title: { en: "Podcast Settings", ar: "إعدادات البودكاست", fr: "Paramètres du Podcast", de: "Podcast-Einstellungen", es: "Ajustes del Podcast" },
  gen_step_4_desc: { en: "Configure the language, duration and atmosphere.", ar: "قم بتكوين اللغة والمدة والأجواء.", fr: "Configurez la langue, la durée et l'atmosphère.", de: "Konfigurieren Sie Sprache, Dauer und Atmosphäre.", es: "Configura el idioma, la duración y la atmósfera." },
  gen_step_5_title: { en: "Edit Dialogue", ar: "تعديل الحوار", fr: "Modifier le Dialogue", de: "Dialog bearbeiten", es: "Editar Diálogo" },
  gen_step_5_desc: { en: "Review and refine the generated script before final production.", ar: "راجع وحسن النص المولد قبل الإنتاج النهائي.", fr: "Révisez et affinez le script généré avant la production finale.", de: "Überprüfen und verfeinern Sie das generierte Skript vor der endgültigen Produktion.", es: "Revisa y refina el guion generado antes de la producción final." },
  gen_search: { en: "Search philosophers", ar: "ابحث عن الفلاسفة", fr: "Rechercher des philosophes", de: "Philosophen suchen", es: "Buscar filósofos" },
  gen_custom_name: { en: "Or enter custom name", ar: "أو أدخل اسماً مخصصاً", fr: "Ou entrez un nom personnalisé", de: "Oder benutzerdefinierten Namen eingeben", es: "O introducir nombre personalizado" },
  gen_enter_name: { en: "Enter philosopher name...", ar: "أدخل اسم الفيلسوف...", fr: "Entrez le nom du philosophe...", de: "Philosophennamen eingeben...", es: "Introducir nombre del filósofo..." },
  gen_enter_desc: { en: "Enter a short description (optional)...", ar: "أدخل وصفاً قصيراً (اختياري)...", fr: "Entrez une courte description (optionnel)...", de: "Kurze Beschreibung eingeben (optional)...", es: "Introducir una descripción corta (opcional)..." },
  gen_next: { en: "Next", ar: "التالي", fr: "Suivant", de: "Weiter", es: "Siguiente" },
  gen_back: { en: "Back", ar: "رجوع", fr: "Retour", de: "Zurück", es: "Atrás" },
  gen_continue_settings: { en: "Continue to Settings", ar: "متابعة إلى الإعدادات", fr: "Continuer vers les Paramètres", de: "Weiter zu den Einstellungen", es: "Continuar a Ajustes" },
  gen_language: { en: "Language", ar: "اللغة", fr: "Langue", de: "Sprache", es: "Idioma" },
  gen_duration: { en: "Duration: {duration} Minutes", ar: "المدة: {duration} دقائق", fr: "Durée : {duration} Minutes", de: "Dauer: {duration} Minuten", es: "Duración: {duration} Minutos" },
  gen_min: { en: "{min} Min", ar: "{min} دقيقة", fr: "{min} Min", de: "{min} Min", es: "{min} Min" },
  gen_bg_music: { en: "Background Music", ar: "موسيقى خلفية", fr: "Musique de Fond", de: "Hintergrundmusik", es: "Música de Fondo" },
  gen_bg_music_desc: { en: "Ambient philosophical atmosphere", ar: "أجواء فلسفية محيطة", fr: "Atmosphère philosophique ambiante", de: "Philosophische Umgebungsatmosphäre", es: "Atmósfera filosófica ambiental" },
  gen_topic_ask: { en: "Select Topic & Ask", ar: "اختر الموضوع واسأل", fr: "Sélectionner le Sujet et Demander", de: "Thema wählen & Fragen", es: "Seleccionar Tema y Preguntar" },
  gen_topic_desc: { en: "What profound subject should they discuss?", ar: "ما هو الموضوع العميق الذي يجب أن يناقشوه؟", fr: "Quel sujet profond devraient-ils aborder ?", de: "Welches tiefgründige Thema sollten sie diskutieren?", es: "¿Qué tema profundo deberían discutir?" },
  gen_ask_question: { en: "Ask a specific question (Optional)", ar: "اسأل سؤالاً محدداً (اختياري)", fr: "Poser une question spécifique (Optionnel)", de: "Spezifische Frage stellen (Optional)", es: "Hacer una pregunta específica (Opcional)" },
  gen_ask_placeholder: { en: "e.g. What would you say about the ethics of AI?", ar: "مثال: ماذا ستقول عن أخلاقيات الذكاء الاصطناعي؟", fr: "ex: Que diriez-vous de l'éthique de l'IA ?", de: "z.B. Was würden Sie zur Ethik der KI sagen?", es: "ej. ¿Qué dirías sobre la ética de la IA?" },
  gen_generate_btn: { en: "Generate Dialogue", ar: "توليد الحوار", fr: "Générer le Dialogue", de: "Dialog generieren", es: "Generar Diálogo" },
  gen_finalize_btn: { en: "Finalize & Produce", ar: "إنهاء وإنتاج", fr: "Finaliser et Produire", de: "Finalisieren & Produzieren", es: "Finalizar y Producir" },
  gen_finalizing: { en: "Finalizing...", ar: "جاري الإنهاء...", fr: "Finalisation...", de: "Finalisierung...", es: "Finalizando..." },
  gen_regenerate: { en: "Not happy? Regenerate Full Dialogue", ar: "غير راضٍ؟ أعد توليد الحوار بالكامل", fr: "Pas satisfait ? Régénérer le Dialogue Complet", de: "Nicht zufrieden? Gesamten Dialog neu generieren", es: "¿No estás satisfecho? Regenerar Diálogo Completo" },
  gen_add_line: { en: "Add Line for {p}", ar: "إضافة سطر لـ {p}", fr: "Ajouter une Ligne pour {p}", de: "Zeile für {p} hinzufügen", es: "Añadir Línea para {p}" },
  gen_remove_line: { en: "Remove line", ar: "إزالة السطر", fr: "Supprimer la ligne", de: "Zeile entfernen", es: "Eliminar línea" },
  gen_voice_label: { en: "Voice", ar: "الصوت", fr: "Voix", de: "Stimme", es: "Voz" },
  gen_voice_natural: { en: "Natural & Expressive", ar: "طبيعي ومعبر", fr: "Naturel et Expressif", de: "Natürlich & Expressiv", es: "Natural y Expresivo" },
  gen_progress: { en: "Progress", ar: "التقدم", fr: "Progrès", de: "Fortschritt", es: "Progreso" },
  
  // Video
  video_ready: { en: "Video Ready", ar: "الفيديو جاهز", fr: "Vidéo Prête", de: "Video bereit", es: "Vídeo Listo" },
  video_ai_video: { en: "AI Video", ar: "فيديو الذكاء الاصطناعي", fr: "Vidéo IA", de: "KI-Video", es: "Vídeo IA" },
  video_publish: { en: "Publish", ar: "نشر", fr: "Publier", de: "Veröffentlichen", es: "Publicar" },
  video_share: { en: "Share", ar: "مشاركة", fr: "Partager", de: "Teilen", es: "Compartir" },
  video_audio: { en: "Audio", ar: "صوت", fr: "Audio", de: "Audio", es: "Audio" },
  video_download: { en: "Download Transcript", ar: "تحميل النص", fr: "Télécharger la Transcription", de: "Transkript herunterladen", es: "Descargar Transcripción" },
  video_producing_audio: { en: "Producing Audio...", ar: "جاري إنتاج الصوت...", fr: "Production de l'Audio...", de: "Audio wird produziert...", es: "Produciendo Audio..." },
  video_generating_dialogue: { en: "Generating Detailed Dialogue...", ar: "جاري توليد حوار مفصل...", fr: "Génération du Dialogue Détaillé...", de: "Detaillierter Dialog wird generiert...", es: "Generando Diálogo Detallado..." },
  
  // Profile
  profile_videos: { en: "Videos", ar: "فيديوهات", fr: "Vidéos", de: "Videos", es: "Vídeos" },
  profile_likes: { en: "Likes", ar: "إعجابات", fr: "J'aime", de: "Likes", es: "Me gusta" },
  profile_plan: { en: "Plan", ar: "الخطة", fr: "Plan", de: "Plan", es: "Plan" },
  profile_my_videos: { en: "My Videos", ar: "فيديوهاتي", fr: "Mes Vidéos", de: "Meine Videos", es: "Mis Vídeos" },
  profile_liked_dialogues: { en: "Liked Dialogues", ar: "الحوارات المعجب بها", fr: "Dialogues Aimés", de: "Gelikte Dialoge", es: "Diálogos que me gustan" },
  profile_subscription: { en: "Subscription", ar: "الاشتراك", fr: "Abonnement", de: "Abonnement", es: "Suscripción" },
  profile_help: { en: "Help & Support", ar: "المساعدة والدعم", fr: "Aide et Support", de: "Hilfe & Support", es: "Ayuda y Soporte" },
  profile_logout: { en: "Logout", ar: "تسجيل الخروج", fr: "Déconnexion", de: "Abmelden", es: "Cerrar Sesión" },
  
  // Liked
  liked_title: { en: "Liked by you", ar: "أعجبتك", fr: "Aimé par vous", de: "Von Ihnen gelikt", es: "Te gusta" },
  liked_empty: { en: "You haven't liked any dialogues yet.", ar: "لم تعجب بأي حوارات بعد.", fr: "Vous n'avez encore aimé aucun dialogue.", de: "Sie haben noch keine Dialoge gelikt.", es: "Aún no te ha gustado ningún diálogo." },
  
  // Subscription
  sub_free: { en: "Free", ar: "مجاني", fr: "Gratuit", de: "Kostenlos", es: "Gratis" },
  sub_pro: { en: "Pro", ar: "برو", fr: "Pro", de: "Pro", es: "Pro" },
  sub_enterprise: { en: "Enterprise", ar: "إنتربرايز", fr: "Entreprise", de: "Enterprise", es: "Enterprise" },
  sub_current_plan: { en: "Current Plan", ar: "الخطة الحالية", fr: "Plan Actuel", de: "Aktueller Plan", es: "Plan Actual" },
  sub_upgrade_now: { en: "Upgrade Now", ar: "ترقية الآن", fr: "Mettre à Niveau", de: "Jetzt upgraden", es: "Mejorar Ahora" },
  sub_manage_plan: { en: "Manage Plan", ar: "إدارة الخطة", fr: "Gérer le Plan", de: "Plan verwalten", es: "Gestionar Plan" },
  
  // Help
  help_faq: { en: "Frequently Asked Questions", ar: "الأسئلة الشائعة", fr: "Questions Fréquemment Posées", de: "Häufig gestellte Fragen", es: "Preguntas Frecuentes" },
  help_still_need: { en: "Still need help?", ar: "ما زلت بحاجة للمساعدة؟", fr: "Besoin d'aide supplémentaire ?", de: "Benötigen Sie noch Hilfe?", es: "¿Aún necesitas ayuda?" },
  help_contact: { en: "Contact Support", ar: "اتصل بالدعم", fr: "Contacter le Support", de: "Support kontaktieren", es: "Contactar Soporte" },
  
  // Warnings
  audio_lost_warning: { 
    en: "Audio not found on this device. Please generate a new video.", 
    ar: "لم يتم العثور على الصوت على هذا الجهاز. يرجى إنشاء فيديو جديد.", 
    fr: "Audio non trouvé sur cet appareil. Veuillez générer une nouvelle vidéo.", 
    de: "Audio auf diesem Gerät nicht gefunden. Bitte generieren Sie ein neues Video.", 
    es: "Audio no encontrado en este dispositivo. Por favor, genera un nuevo vídeo." 
  },
  
  // Common
  common_all: { en: "All", ar: "الكل", fr: "Tout", de: "Alle", es: "Todo" },
  common_male: { en: "Male", ar: "ذكر", fr: "Homme", de: "Männlich", es: "Masculino" },
  common_female: { en: "Female", ar: "أنثى", fr: "Femme", de: "Weiblich", es: "Femenino" },
  common_natural: { en: "Natural & Expressive", ar: "طبيعي ومعبر", fr: "Naturel et Expressif", de: "Natürlich & Expressiv", es: "Natural y Expresivo" },
  common_topic: { en: "Topic", ar: "الموضوع", fr: "Sujet", de: "Thema", es: "Tema" },
  language: { en: "Language", ar: "اللغة", fr: "Langue", de: "Sprache", es: "Idioma" },
  my_videos: { en: "My Videos", ar: "فيديوهاتي", fr: "Mes Vidéos", de: "Meine Videos", es: "Mis Vídeos" },
  liked_dialogues: { en: "Liked Dialogues", ar: "الحوارات المعجب بها", fr: "Dialogues Aimés", de: "Gelikte Dialoge", es: "Diálogos que me gustan" },
  subscription: { en: "Subscription", ar: "الاشتراك", fr: "Abonnement", de: "Abonnement", es: "Suscripción" },
  help_support: { en: "Help & Support", ar: "المساعدة والدعم", fr: "Aide et Support", de: "Hilfe & Support", es: "Ayuda y Soporte" },
  logout: { en: "Logout", ar: "تسجيل الخروج", fr: "Déconnexion", de: "Abmelden", es: "Cerrar Sesión" },
  
  // Login
  login_desc: { en: "Generate cinematic philosophical dialogues between the world's greatest minds.", ar: "ولد حوارات فلسفية سينمائية بين أعظم العقول في العالم.", fr: "Générez des dialogues philosophiques cinématographiques entre les plus grands esprits du monde.", de: "Generieren Sie kinoreife philosophische Dialoge zwischen den größten Denkern der Welt.", es: "Genera diálogos filosóficos cinematográficos entre las mentes más grandes del mundo." },
  login_btn: { en: "Sign in with Google", ar: "تسجيل الدخول باستخدام جوجل", fr: "Se connecter avec Google", de: "Mit Google anmelden", es: "Iniciar sesión con Google" },
  
  // History
  history_title: { en: "Your History", ar: "سجلك", fr: "Votre Historique", de: "Ihr Verlauf", es: "Tu Historial" },
  history_empty: { en: "You haven't generated any dialogues yet.", ar: "لم تقم بتوليد أي حوارات بعد.", fr: "Vous n'avez pas encore généré de dialogues.", de: "Sie haben noch keine Dialoge generiert.", es: "Aún no has generado ningún diálogo." },
  history_confirm_delete: { en: "Are you sure you want to delete this dialogue?", ar: "هل أنت متأكد أنك تريد حذف هذا الحوار؟", fr: "Êtes-vous sûr de vouloir supprimer ce dialogue ?", de: "Sind Sie sicher, dass Sie diesen Dialog löschen möchten?", es: "¿Estás seguro de que quieres eliminar este diálogo?" },
  history_cancel: { en: "Cancel", ar: "إلغاء", fr: "Annuler", de: "Abbrechen", es: "Cancelar" },
  history_delete: { en: "Delete", ar: "حذف", fr: "Supprimer", de: "Löschen", es: "Eliminar" },
  history_delete_success: { en: "Dialogue deleted successfully", ar: "تم حذف الحوار بنجاح", fr: "Dialogue supprimé avec succès", de: "Dialog erfolgreich gelöscht", es: "Diálogo eliminado con éxito" },
  history_delete_error: { en: "Failed to delete dialogue", ar: "فشل حذف الحوار", fr: "Échec de la suppression du dialogue", de: "Fehler beim Löschen des Dialogs", es: "Error al eliminar el diálogo" },
  
  // Likes
  like_success: { en: "Added to liked dialogues", ar: "تمت الإضافة إلى الحوارات المعجب بها", fr: "Ajouté aux dialogues aimés", de: "Zu gelikten Dialogen hinzugefügt", es: "Añadido a diálogos que me gustan" },
  like_error: { en: "Failed to like dialogue", ar: "فشل الإعجاب بالحوار", fr: "Échec de l'ajout aux favoris", de: "Fehler beim Liken des Dialogs", es: "Error al marcar como me gusta" },
  unlike_success: { en: "Removed from liked dialogues", ar: "تمت الإزالة من الحوارات المعجب بها", fr: "Retiré des dialogues aimés", de: "Von gelikten Dialogen entfernt", es: "Eliminado de diálogos que me gustan" },
  unlike_error: { en: "Failed to unlike dialogue", ar: "فشل إزالة الإعجاب بالحوار", fr: "Échec du retrait des favoris", de: "Fehler beim Entfernen des Likes", es: "Error al quitar me gusta" },
  
  // Subscriptions Features
  sub_feature_unlimited: { en: "Unlimited generations", ar: "توليد غير محدود", fr: "Générations illimitées", de: "Unbegrenzte Generierungen", es: "Generaciones ilimitadas" },
  sub_feature_4k: { en: "4K Video quality", ar: "جودة فيديو 4K", fr: "Qualité vidéo 4K", de: "4K Videoqualität", es: "Calidad de vídeo 4K" },
  sub_feature_priority: { en: "Priority support", ar: "دعم ذو أولوية", fr: "Support prioritaire", de: "Prioritäts-Support", es: "Soporte prioritario" },
  sub_feature_commercial: { en: "Commercial license", ar: "رخصة تجارية", fr: "Licence commerciale", de: "Gewerbliche Lizenz", es: "Licencia comercial" },
  sub_feature_basic: { en: "5 generations / month", ar: "5 عمليات توليد / شهر", fr: "5 générations / mois", de: "5 Generierungen / Monat", es: "5 generaciones / mes" },
  sub_feature_hd: { en: "HD Video quality", ar: "جودة فيديو HD", fr: "Qualité vidéo HD", de: "HD Videoqualität", es: "Calidad de vídeo HD" },
  sub_feature_community: { en: "Community access", ar: "الوصول إلى المجتمع", fr: "Accès à la communauté", de: "Community-Zugang", es: "Acceso a la comunidad" },
  
  // FAQ
  help_faq_1_q: { en: "How does it work?", ar: "كيف يعمل؟", fr: "Comment ça marche ?", de: "Wie funktioniert es?", es: "¿Cómo funciona?" },
  help_faq_1_a: { en: "We use advanced AI to simulate philosophical debates and generate cinematic videos.", ar: "نحن نستخدم الذكاء الاصطناعي المتقدم لمحاكاة المناظرات الفلسفية وتوليد فيديوهات سينمائية.", fr: "Nous utilisons une IA avancée pour simuler des débats philosophiques et générer des vidéos cinématographiques.", de: "Wir nutzen fortschrittliche KI, um philosophische Debatten zu simulieren und kinoreife Videos zu generieren.", es: "Utilizamos IA avanzada para simular debates filosóficos y generar vídeos cinematográficos." },
  help_faq_2_q: { en: "Is it free?", ar: "هل هو مجاني؟", fr: "Est-ce gratuit ?", de: "Ist es kostenlos?", es: "¿Es gratis?" },
  help_faq_2_a: { en: "Yes, we offer a free plan with limited generations per month.", ar: "نعم، نحن نقدم خطة مجانية مع عدد محدود من عمليات التوليد شهرياً.", fr: "Oui, nous proposons un plan gratuit avec des générations limitées par mois.", de: "Ja, wir bieten einen kostenlosen Plan mit begrenzten Generierungen pro Monat an.", es: "Sí, ofrecemos un plan gratuito con generaciones limitadas al mes." },
  help_faq_3_q: { en: "Can I download videos?", ar: "هل يمكنني تحميل الفيديوهات؟", fr: "Puis-je télécharger les vidéos ?", de: "Kann ich Videos herunterladen?", es: "¿Puedo descargar los vídeos?" },
  help_faq_3_a: { en: "Pro and Enterprise users can download their generated videos in high quality.", ar: "يمكن لمستخدمي برو وإنتربرايز تحميل فيديوهاتهم المولدة بجودة عالية.", fr: "Les utilisateurs Pro et Enterprise peuvent télécharger leurs vidéos générées en haute qualité.", de: "Pro- und Enterprise-Nutzer können ihre generierten Videos in hoher Qualität herunterladen.", es: "Los usuarios Pro y Enterprise pueden descargar sus vídeos generados en alta calidad." },
  help_faq_4_q: { en: "Which philosophers are available?", ar: "ما هم الفلاسفة المتاحون؟", fr: "Quels philosophes sont disponibles ?", de: "Welche Philosophen sind verfügbar?", es: "¿Qué filósofos están disponibles?" },
  help_faq_4_a: { en: "We have a wide range of masters from Socrates to modern thinkers.", ar: "لدينا مجموعة واسعة من المعلمين من سقراط إلى المفكرين المعاصرين.", fr: "Nous avons un large éventail de maîtres, de Socrate aux penseurs modernes.", de: "Wir haben eine breite Palette von Meistern, von Sokrates bis zu modernen Denkern.", es: "Tenemos una amplia gama de maestros, desde Sócrates hasta pensadores modernos." },
  help_faq_5_q: { en: "How long does generation take?", ar: "كم يستغرق التوليد؟", fr: "Combien de temps prend la génération ?", de: "Wie lange dauert die Generierung?", es: "¿Cuánto tiempo tarda la generación?" },
  help_faq_5_a: { en: "Usually between 1-3 minutes depending on the complexity and duration.", ar: "عادة ما يستغرق بين 1-3 دقائق حسب التعقيد والمدة.", fr: "Généralement entre 1 et 3 minutes selon la complexité et la durée.", de: "Normalerweise zwischen 1-3 Minuten, je nach Komplexität und Dauer.", es: "Normalmente entre 1 y 3 minutos dependiendo de la complejidad y duración." },
  help_faq_6_q: { en: "Can I use it for commercial purposes?", ar: "هل يمكنني استخدامه لأغراض تجارية؟", fr: "Puis-je l'utiliser à des fins commerciales ?", de: "Kann ich es für kommerzielle Zwecke nutzen?", es: "¿Puedo usarlo para fines comerciales?" },
  help_faq_6_a: { en: "Commercial use is available for Enterprise plan subscribers.", ar: "الاستخدام التجاري متاح لمشتركي خطة إنتربرايز.", fr: "L'utilisation commerciale est disponible pour les abonnés au plan Enterprise.", de: "Die kommerzielle Nutzung ist für Abonnenten des Enterprise-Plans verfügbar.", es: "El uso comercial está disponible para los suscriptores del plan Enterprise." },
  
  // Video Screen & Actions
  philosophical_debate: { en: "Philosophical Debate", ar: "مناظرة فلسفية", fr: "Débat Philosophique", de: "Philosophische Debatte", es: "Debate Filosófico" },
  ai_video_mode: { en: "AI Video Mode", ar: "وضع فيديو الذكاء الاصطناعي", fr: "Mode Vidéo IA", de: "KI-Videomodus", es: "Modo Vídeo IA" },
  generating_ai_video: { en: "Generating AI Video...", ar: "جاري توليد فيديو الذكاء الاصطناعي...", fr: "Génération de la Vidéo IA...", de: "KI-Video wird generiert...", es: "Generando Vídeo IA..." },
  heygen_connecting: { en: "Connecting {p1} and {p2} in the digital realm...", ar: "جاري ربط {p1} و {p2} في العالم الرقمي...", fr: "Connexion de {p1} et {p2} dans le royaume numérique...", de: "Verbindung von {p1} und {p2} im digitalen Reich...", es: "Conectando a {p1} y {p2} en el reino digital..." },
  ai_video_heygen: { en: "AI Video", ar: "فيديو الذكاء الاصطناعي", fr: "Vidéo IA", de: "KI-Video", es: "Vídeo IA" },
  download_transcript: { en: "Download Transcript", ar: "تحميل النص", fr: "Télécharger la Transcription", de: "Transkript herunterladen", es: "Descargar Transcripción" },
  video: { en: "Video", ar: "فيديو", fr: "Vidéo", de: "Video", es: "Vídeo" },
  no_podcast_selected: { en: "No podcast selected", ar: "لم يتم اختيار بودكاست", fr: "Aucun podcast sélectionné", de: "Kein Podcast ausgewählt", es: "Ningún podcast seleccionado" },
  go_home: { en: "Go Home", ar: "العودة للرئيسية", fr: "Retour à l'Accueil", de: "Zur Startseite", es: "Ir al Inicio" },
  dialogue_published: { en: "Dialogue published to community!", ar: "تم نشر الحوار للمجتمع!", fr: "Dialogue publié dans la communauté !", de: "Dialog in der Community veröffentlicht!", es: "¡Diálogo publicado en la comunidad!" },
  failed_to_publish: { en: "Failed to publish dialogue", ar: "فشل نشر الحوار", fr: "Échec de la publication du dialogue", de: "Fehler beim Veröffentlichen des Dialogs", es: "Error al publicar el diálogo" },
  share_text: { en: "Check out this philosophical dialogue about {topic}!", ar: "شاهد هذا الحوار الفلسفي حول {topic}!", fr: "Découvrez ce dialogue philosophique sur {topic} !", de: "Schauen Sie sich diesen philosophischen Dialog über {topic} an!", es: "¡Mira este diálogo filosófico sobre {topic}!" },
  link_copied: { en: "Link copied to clipboard", ar: "تم نسخ الرابط إلى الحافظة", fr: "Lien copié dans le presse-papiers", de: "Link in die Zwischenablage kopiert", es: "Enlace copiado al portapapeles" },
  login_to_like: { en: "Please login to like dialogues", ar: "يرجى تسجيل الدخول للإعجاب بالحوارات", fr: "Veuillez vous connecter pour aimer les dialogues", de: "Bitte melden Sie sich an, um Dialoge zu liken", es: "Inicia sesión para que te gusten los diálogos" },
  added_to_liked: { en: "Added to liked dialogues", ar: "تمت الإضافة إلى الحوارات المعجب بها", fr: "Ajouté aux dialogues aimés", de: "Zu gelikten Dialogen hinzugefügt", es: "Añadido a diálogos que me gustan" },

  // Community
  community_feed: { en: "Community Feed", ar: "خلاصة المجتمع", fr: "Fil de la Communauté", de: "Community-Feed", es: "Feed de la Comunidad" },
  exploring_depths: { en: "Exploring the depths of {topic}", ar: "استكشاف أعماق {topic}", fr: "Explorer les profondeurs de {topic}", de: "Die Tiefen von {topic} erkunden", es: "Explorando las profundidades de {topic}" },
  view_dialogue: { en: "View Dialogue", ar: "عرض الحوار", fr: "Voir le Dialogue", de: "Dialog anzeigen", es: "Ver Diálogo" },
  no_public_dialogues: { en: "No public dialogues yet. Be the first to publish!", ar: "لا توجد حوارات عامة بعد. كن أول من ينشر!", fr: "Pas encore de dialogues publics. Soyez le premier à publier !", de: "Noch keine öffentlichen Dialoge. Seien Sie der Erste, der veröffentlicht!", es: "Aún no hay diálogos públicos. ¡Sé el primero en publicar!" },
  no_public_books: { en: "No public book summaries yet. Be the first to publish!", ar: "لا توجد ملخصات كتب عامة بعد. كن أول من ينشر!", fr: "Pas encore de résumés de livres publics. Soyez le premier à publier !", de: "Noch keine öffentlichen Buchzusammenfassungen. Seien Sie der Erste, der veröffentlicht!", es: "Aún no hay resúmenes de libros públicos. ¡Sé el primero en publicar!" },

  // Profile
  profile: { en: "Profile", ar: "الملف الشخصي", fr: "Profil", de: "Profil", es: "Perfil" },
  user_name: { en: "Philosopher", ar: "فيلسوف", fr: "Philosophe", de: "Philosoph", es: "Filósofo" },
  videos: { en: "Videos", ar: "فيديوهات", fr: "Vidéos", de: "Videos", es: "Vídeos" },
  likes: { en: "Likes", ar: "إعجابات", fr: "J'aime", de: "Likes", es: "Me gusta" },
  subscribers: { en: "Subscribers", ar: "المشتركون", fr: "Abonnés", de: "Abonnenten", es: "Suscriptores" },
  free: { en: "Free", ar: "مجاني", fr: "Gratuit", de: "Kostenlos", es: "Gratis" },
  plan: { en: "Plan", ar: "الخطة", fr: "Plan", de: "Plan", es: "Plan" },
  mo: { en: "mo", ar: "شهر", fr: "mois", de: "Mon.", es: "mes" },
  already_on_plan: { en: "You are already on the {plan} plan", ar: "أنت مشترك بالفعل في خطة {plan}", fr: "Vous êtes déjà sur le plan {plan}", de: "Sie nutzen bereits den {plan}-Plan", es: "Ya estás en el plan {plan}" },
  upgrade_success: { en: "Successfully upgraded to {plan}!", ar: "تمت الترقية بنجاح إلى {plan}!", fr: "Mise à niveau réussie vers {plan} !", de: "Erfolgreiches Upgrade auf {plan}!", es: "¡Mejorado con éxito a {plan}!" },
  upgrade_failed: { en: "Failed to upgrade plan", ar: "فشل ترقية الخطة", fr: "Échec de la mise à niveau du plan", de: "Upgrade des Plans fehlgeschlagen", es: "Error al mejorar el plan" },

  // Subscription Features
  feature_3_dialogues: { en: "3 Dialogues per month", ar: "3 حوارات شهرياً", fr: "3 Dialogues par mois", de: "3 Dialoge pro Monat", es: "3 Diálogos al mes" },
  feature_standard_quality: { en: "Standard Quality", ar: "جودة قياسية", fr: "Qualité Standard", de: "Standardqualität", es: "Calidad Estándar" },
  feature_community_access: { en: "Community Access", ar: "الوصول للمجتمع", fr: "Accès à la Communauté", de: "Community-Zugang", es: "Acceso a la Comunidad" },
  feature_unlimited_dialogues: { en: "Unlimited Dialogues", ar: "حوارات غير محدودة", fr: "Dialogues Illimités", de: "Unbegrenzte Dialoge", es: "Diálogos Ilimitados" },
  feature_4k_quality: { en: "4K Video Quality", ar: "جودة فيديو 4K", fr: "Qualité Vidéo 4K", de: "4K Videoqualität", es: "Calidad de Vídeo 4K" },
  feature_custom_voices: { en: "Custom AI Voices", ar: "أصوات ذكاء اصطناعي مخصصة", fr: "Voix IA Personnalisées", de: "Benutzerdefinierte KI-Stimmen", es: "Voces de IA Personalizadas" },
  feature_no_watermark: { en: "No Watermark", ar: "بدون علامة مائية", fr: "Sans Filigrane", de: "Kein Wasserzeichen", es: "Sin Marca de Agua" },
  feature_api_access: { en: "API Access", ar: "الوصول إلى API", fr: "Accès API", de: "API-Zugang", es: "Acceso a API" },
  feature_commercial_rights: { en: "Commercial Rights", ar: "حقوق تجارية", fr: "Droits Commerciaux", de: "Gewerbliche Rechte", es: "Derechos Comerciales" },
  feature_priority_support: { en: "Priority Support", ar: "دعم ذو أولوية", fr: "Support Prioritaire", de: "Prioritäts-Support", es: "Soporte Prioritario" },

  // Help & Support
  faqs: { en: "Frequently Asked Questions", ar: "الأسئلة الشائعة", fr: "Questions Fréquemment Posées", de: "Häufig gestellte Fragen", es: "Preguntas Frecuentes" },
  still_need_help: { en: "Still need help?", ar: "ما زلت بحاجة للمساعدة؟", fr: "Besoin d'aide supplémentaire ?", de: "Benötigen Sie noch Hilfe?", es: "¿Aún necesitas ayuda?" },
  support_team_available: { en: "Our support team is available 24/7", ar: "فريق الدعم لدينا متاح على مدار الساعة", fr: "Notre équipe de support est disponible 24h/24 et 7j/7", de: "Unser Support-Team ist rund um die Uhr verfügbar", es: "Nuestro equipo de soporte está disponible 24/7" },
  contact_support: { en: "Contact Support", ar: "اتصل بالدعم", fr: "Contacter le Support", de: "Support kontaktieren", es: "Contactar Soporte" },
  support_request_sent: { en: "Support request sent successfully!", ar: "تم إرسال طلب الدعم بنجاح!", fr: "Demande de support envoyée avec succès !", de: "Supportanfrage erfolgreich gesendet!", es: "¡Solicitud de soporte enviada con éxito!" },

  // History
  history: { en: "History", ar: "السجل", fr: "Historique", de: "Verlauf", es: "Historial" },
  confirm_delete: { en: "Are you sure you want to delete this dialogue?", ar: "هل أنت متأكد أنك تريد حذف هذا الحوار؟", fr: "Êtes-vous sûr de vouloir supprimer ce dialogue ?", de: "Sind Sie sicher, dass Sie diesen Dialog löschen möchten?", es: "¿Estás seguro de que quieres eliminar este diálogo?" },
  delete_success: { en: "Dialogue deleted successfully", ar: "تم حذف الحوار بنجاح", fr: "Dialogue supprimé avec succès", de: "Dialog erfolgreich gelöscht", es: "Diálogo eliminado con éxito" },
  delete_failed: { en: "Failed to delete dialogue", ar: "فشل حذف الحوار", fr: "Échec de la suppression du dialogue", de: "Fehler beim Löschen des Dialogs", es: "Error al eliminar el diálogo" },
  no_history: { en: "No dialogues generated yet", ar: "لم يتم توليد أي حوارات بعد", fr: "Aucun dialogue généré pour le moment", de: "Noch keine Dialoge generiert", es: "Aún no se han generado diálogos" },

  // Login
  login_description: { en: "Generate cinematic philosophical dialogues between the world's greatest minds.", ar: "ولد حوارات فلسفية سينمائية بين أعظم العقول في العالم.", fr: "Générez des dialogues philosophiques cinématographiques entre les plus grands esprits du monde.", de: "Generieren Sie kinoreife philosophische Dialoge zwischen den größten Denkern der Welt.", es: "Genera diálogos filosóficos cinematográficos entre las mentes más grandes del mundo." },
  continue_with_google: { en: "Continue with Google", ar: "المتابعة باستخدام جوجل", fr: "Continuer avec Google", de: "Mit Google fortfahren", es: "Continuar con Google" },
  gen_topic_search: { en: "Search topics...", ar: "ابحث عن المواضيع...", fr: "Rechercher des sujets...", de: "Themen suchen...", es: "Buscar temas..." },
  gen_ask_gemini: { en: "Ask Gemini", ar: "اسأل جيميناي", fr: "Demander à Gemini", de: "Gemini fragen", es: "Preguntar a Gemini" },
  gen_suggesting: { en: "Suggesting...", ar: "جاري الاقتراح...", fr: "Suggestion...", de: "Vorschlagen...", es: "Sugiriendo..." },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isRtl: boolean;
}

const LanguageContext = React.createContext<LanguageContextType | null>(null);

const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string, params?: Record<string, string>) => {
    let text = translations[key]?.[language] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  const isRtl = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

// --- Auth Context ---
interface UserProfile extends FirebaseUser {
  plan?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Sync user to Firestore and get profile
        const userRef = doc(db, "users", u.uid);
        try {
          const userDoc = await getDoc(userRef);
          let plan = "Free";
          if (userDoc.exists()) {
            plan = userDoc.data().plan || "Free";
          }
          
          const profile: UserProfile = {
            ...u,
            plan
          };
          setUser(profile);

          const dataToSet: any = {
            uid: u.uid,
            displayName: u.displayName,
            email: u.email,
            photoURL: u.photoURL,
            updatedAt: serverTimestamp(),
            plan: plan
          };
          if (!userDoc.exists()) {
            dataToSet.createdAt = serverTimestamp();
          }
          await setDoc(userRef, dataToSet, { merge: true });
        } catch (err) {
          console.error("Auth sync error:", err);
          try {
            handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`);
          } catch (e) {
            // Logged context
          }
          setUser(u as UserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign in error:", err);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- IndexedDB Setup for Audio Persistence ---
const DB_NAME = 'philosophy_app_db';
const STORE_NAME = 'audio_blobs';
const VIDEO_STORE_NAME = 'video_blobs';

async function initDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
        db.createObjectStore(VIDEO_STORE_NAME);
      }
    },
  });
}

async function saveAudioBlob(id: string, blob: Blob) {
  const db = await initDB();
  await db.put(STORE_NAME, blob, id);
}

async function getAudioBlob(id: string): Promise<Blob | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

async function saveVideoBlob(id: string, blob: Blob) {
  const db = await initDB();
  await db.put(VIDEO_STORE_NAME, blob, id);
}

async function getVideoBlob(id: string): Promise<Blob | undefined> {
  const db = await initDB();
  return db.get(VIDEO_STORE_NAME, id);
}

// --- Types ---
interface Philosopher {
  id: string;
  name: string;
  avatar: string;
  description: string;
  defaultVoice: string;
  era: 'ancient' | 'medieval' | 'modern' | 'contemporary';
  specialization: 'Ethics' | 'Metaphysics' | 'Political' | 'Existentialism' | 'Logic' | 'Epistemology' | 'Islamic' | 'Eastern';
}

interface DialogueExchange {
  speaker: string;
  text: string;
  emotion: string;
}

interface VideoMetadata {
  id: string;
  userId?: string;
  authorName?: string;
  authorPhoto?: string;
  philosopher1: string;
  philosopher2: string;
  topic: string;
  video_url: string;
  audio_url?: string;
  dialogue?: DialogueExchange[];
  created_at: string;
  include_music?: boolean;
  language?: string;
  philosopher1Voice?: string;
  philosopher2Voice?: string;
  p1Avatar?: { background: string; clothes: string; microphone: string };
  p2Avatar?: { background: string; clothes: string; microphone: string };
  videoFormat?: 'landscape' | 'portrait';
  isPublic?: boolean;
  likes?: number;
  socialTitle?: string;
  socialDescription?: string;
  generationMode?: "dialogue" | "book_summary" | "solo";
}

// Helper to convert PCM to WAV
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  
  // RIFF identifier
  view.setUint32(0, 0x52494646, false);
  // File length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false);
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false);
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false);
  // data chunk length
  view.setUint32(40, pcmData.length, true);
  
  // Copy PCM data
  new Uint8Array(buffer, 44).set(pcmData);
  
  return new Blob([buffer], { type: 'audio/wav' });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Mock Data ---
const PHILOSOPHERS: Philosopher[] = [
  { id: "1", name: "Socrates", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Socrates&backgroundColor=ffdfbf", description: "The unexamined life is not worth living.", defaultVoice: "Charon", era: 'ancient', specialization: 'Ethics' },
  { id: "2", name: "Plato", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Plato&backgroundColor=d1d4f9", description: "Wise men speak because they have something to say.", defaultVoice: "Kore", era: 'ancient', specialization: 'Metaphysics' },
  { id: "3", name: "Aristotle", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Aristotle&backgroundColor=ffd5dc", description: "Happiness is the meaning and the purpose of life.", defaultVoice: "Fenrir", era: 'ancient', specialization: 'Logic' },
  { id: "4", name: "Nietzsche", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Nietzsche&backgroundColor=c0aede", description: "He who has a why to live can bear almost any how.", defaultVoice: "Zephyr", era: 'modern', specialization: 'Existentialism' },
  { id: "5", name: "Ibn Sina", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=IbnSina&backgroundColor=b6e3f4", description: "The soul is like a mirror.", defaultVoice: "Puck", era: 'medieval', specialization: 'Islamic' },
  { id: "6", name: "Descartes", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Descartes&backgroundColor=c1f4c1", description: "I think, therefore I am.", defaultVoice: "Charon", era: 'modern', specialization: 'Epistemology' },
  { id: "7", name: "Marcus Aurelius", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Marcus&backgroundColor=ffdfbf", description: "You have power over your mind - not outside events.", defaultVoice: "Fenrir", era: 'ancient', specialization: 'Ethics' },
  { id: "8", name: "Immanuel Kant", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Kant&backgroundColor=d1d4f9", description: "Act only according to that maxim whereby you can.", defaultVoice: "Zephyr", era: 'modern', specialization: 'Ethics' },
  { id: "9", name: "John Locke", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Locke&backgroundColor=ffd5dc", description: "New opinions are always suspected.", defaultVoice: "Puck", era: 'modern', specialization: 'Political' },
  { id: "10", name: "Simone de Beauvoir", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Simone&backgroundColor=c0aede", description: "One is not born, but rather becomes, a woman.", defaultVoice: "Kore", era: 'contemporary', specialization: 'Existentialism' },
  { id: "11", name: "Confucius", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Confucius&backgroundColor=b6e3f4", description: "It does not matter how slowly you go as long as you do not stop.", defaultVoice: "Charon", era: 'ancient', specialization: 'Eastern' },
  { id: "12", name: "Al-Ghazali", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ghazali&backgroundColor=c1f4c1", description: "The heart has its reasons which reason knows nothing of.", defaultVoice: "Zephyr", era: 'medieval', specialization: 'Islamic' },
  { id: "13", name: "Karl Marx", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Marx&backgroundColor=ffdfbf", description: "The philosophers have only interpreted the world.", defaultVoice: "Fenrir", era: 'modern', specialization: 'Political' },
  { id: "14", name: "Lao Tzu", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=LaoTzu&backgroundColor=d1d4f9", description: "The journey of a thousand miles begins with one step.", defaultVoice: "Puck", era: 'ancient', specialization: 'Eastern' },
];

const SPECIALIZATIONS = [
  "All", "Ethics", "Metaphysics", "Political", "Existentialism", "Logic", "Epistemology", "Islamic", "Eastern"
];

const VOICES = [
  { id: "Charon", name: "Deep & Wise", gender: "Male" },
  { id: "Kore", name: "Clear & Academic", gender: "Female" },
  { id: "Puck", name: "Youthful & Energetic", gender: "Male" },
  { id: "Zephyr", name: "Calm & Reflective", gender: "Male" },
  { id: "Fenrir", name: "Strong & Authoritative", gender: "Male" },
];

const AVATAR_BACKGROUNDS = [
  { id: 'podcast_studio', name: 'Podcast Studio', icon: '🎙️' },
  { id: 'library', name: 'Classic Library', icon: '📚' },
  { id: 'minimalist', name: 'Minimalist', icon: '⚪' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌆' },
  { id: 'nature', name: 'Nature', icon: '🌲' },
];

const AVATAR_CLOTHES = [
  { id: 'formal_suit', name: 'Formal Suit', icon: '👔' },
  { id: 'casual', name: 'Casual', icon: '👕' },
  { id: 'historical', name: 'Historical', icon: '📜' },
  { id: 'modern', name: 'Modern Minimalist', icon: '🧥' },
];

const AVATAR_MICROPHONES = [
  { id: 'shure_sm7b', name: 'Shure SM7B', icon: '🎙️' },
  { id: 'rode_nt1', name: 'Rode NT1', icon: '🎤' },
  { id: 'vintage', name: 'Vintage Mic', icon: '📻' },
  { id: 'lavalier', name: 'Lavalier', icon: '👔' },
];

const TOPICS = [
  "Reality", "Existence", "Time", "Truth", "Knowledge", "God", "Human Nature", "Ethics", "Justice"
];

const LANGUAGES = [
  { id: "ar", name: "Arabic (العربية)", flag: "🇸🇦" },
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "fr", name: "French", flag: "🇫🇷" },
  { id: "de", name: "German", flag: "🇩🇪" },
  { id: "es", name: "Spanish", flag: "🇪🇸" },
];

// --- Components ---

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRtl } = useLanguage();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 px-6 py-4 flex justify-between items-center z-50 max-w-md mx-auto",
      isRtl && "flex-row-reverse"
    )}>
      <button onClick={() => navigate("/")} className={cn("flex flex-col items-center gap-1 transition-colors", isActive("/") ? "text-orange-500" : "text-white/60")}>
        <Home size={24} />
        <span className="text-[10px] uppercase tracking-wider font-medium">{t("nav_home")}</span>
      </button>
      <button onClick={() => navigate("/community")} className={cn("flex flex-col items-center gap-1 transition-colors", isActive("/community") ? "text-orange-500" : "text-white/60")}>
        <Users size={24} />
        <span className="text-[10px] uppercase tracking-wider font-medium">{t("nav_feed")}</span>
      </button>
      <button onClick={() => navigate("/generate")} className="bg-orange-500 p-3 rounded-full -mt-10 shadow-lg shadow-orange-500/30 text-white hover:scale-110 transition-transform">
        <Plus size={28} />
      </button>
      <button onClick={() => navigate("/history")} className={cn("flex flex-col items-center gap-1 transition-colors", isActive("/history") ? "text-orange-500" : "text-white/60")}>
        <History size={24} />
        <span className="text-[10px] uppercase tracking-wider font-medium">{t("nav_history")}</span>
      </button>
      <button onClick={() => navigate("/profile")} className={cn("flex flex-col items-center gap-1 transition-colors", isActive("/profile") ? "text-orange-500" : "text-white/60")}>
        <UserIcon size={24} />
        <span className="text-[10px] uppercase tracking-wider font-medium">{t("nav_profile")}</span>
      </button>
    </nav>
  );
};

const Header = ({ showBack = false }: { title?: string; showBack?: boolean }) => {
  const navigate = useNavigate();
  const { isRtl } = useLanguage();
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-lg px-6 py-6 flex items-center gap-4 z-50 max-w-md mx-auto",
      "flex-row" // Always LTR for the header brand
    )}>
      {showBack && (
        <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white">
          {isRtl ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="relative w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Brain size={22} className="text-white" />
            {/* Speech bubble tail */}
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-orange-600 rotate-45 rounded-sm -z-10" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">PhiloTalk</h1>
      </div>
    </header>
  );
};

// --- Screens ---

const HomeScreen = ({ history, setCurrentVideo }: { history: VideoMetadata[], setCurrentVideo: (v: VideoMetadata) => void }) => {
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();
  const { setGenerationMode, setStep } = useGeneration();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  return (
    <div 
      className={cn("min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6", isRtl && "text-right")}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Header title={t("header_title")} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full p-8 rounded-[32px] bg-gradient-to-br from-orange-500 to-red-600 mb-10 shadow-2xl shadow-orange-500/20"
      >
        <h2 className="text-2xl font-bold mb-2">{t("home_generate_title")}</h2>
        <p className="text-white/80 text-sm mb-6 max-w-[80%]">{t("home_generate_desc")}</p>
        <button 
          onClick={() => setIsStartModalOpen(true)}
          className={cn("bg-white text-black px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2", isRtl && "flex-row-reverse")}
        >
          {t("home_start_now")} {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </motion.div>

      {isStartModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#141414] rounded-3xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold mb-4 text-center">{t("choose_generation_mode")}</h3>
            <div className="space-y-3">
              <button 
                onClick={() => { setGenerationMode("solo"); setStep(3); navigate("/generate"); }} 
                className={cn("w-full p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 transition-colors hover:bg-white/10", isRtl && "flex-row-reverse")}
              >
                <Volume2 size={24} className="text-orange-500" />
                <div className={cn("text-left", isRtl && "text-right")}>
                  <div className="font-bold">{t("mode_solo") || "Solo Voiceover"}</div>
                  <div className="text-xs text-white/60">{t("mode_solo_desc") || "Generate a high-quality voiceover for any text."}</div>
                </div>
              </button>
              <button 
                onClick={() => { setGenerationMode("dialogue"); navigate("/generate"); }} 
                className={cn("w-full p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 transition-colors hover:bg-white/10", isRtl && "flex-row-reverse")}
              >
                <MessageSquare size={24} className="text-orange-500" />
                <div className={cn("text-left", isRtl && "text-right")}>
                  <div className="font-bold">{t("mode_dialogue")}</div>
                  <div className="text-xs text-white/60">{t("mode_dialogue_desc")}</div>
                </div>
              </button>
              <button 
                onClick={() => { setGenerationMode("book_summary"); navigate("/generate"); }} 
                className={cn("w-full p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 transition-colors hover:bg-white/10", isRtl && "flex-row-reverse")}
              >
                <BookOpen size={24} className="text-orange-500" />
                <div className={cn("text-left", isRtl && "text-right")}>
                  <div className="font-bold">{t("mode_book_summary")}</div>
                  <div className="text-xs text-white/60">{t("mode_book_summary_desc")}</div>
                </div>
              </button>
            </div>
            <button onClick={() => setIsStartModalOpen(false)} className="mt-6 w-full py-3 bg-white/10 rounded-xl font-bold">{t("cancel")}</button>
          </div>
        </div>
      )}

      <section className="mb-10">
        <div className={cn("flex justify-between items-end mb-4", isRtl && "flex-row-reverse")}>
          <h2 className="text-2xl font-bold">{t("home_recent_dialogues")}</h2>
          <button className="text-orange-500 text-sm font-medium" onClick={() => navigate("/history")}>{t("home_view_all")}</button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {history.length > 0 ? history.slice(0, 3).map((v) => (
            <motion.div 
              key={v.id}
              whileHover={{ scale: 1.02 }}
              className={cn("bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 cursor-pointer", isRtl && "flex-row-reverse")}
              onClick={() => { setCurrentVideo(v); navigate(`/video/${v.id}`); }}
            >
              <div className="w-20 h-20 bg-white/10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                <Play size={24} className="text-orange-500 fill-orange-500" />
              </div>
              <div className={cn("flex flex-col justify-center", isRtl && "text-right")}>
                <h3 className="font-semibold text-lg">{v.philosopher1} vs {v.philosopher2}</h3>
                <p className="text-white/60 text-sm">
                  {t("common_topic")}: {v.topic.startsWith("Summary of ") 
                    ? v.topic.replace("Summary of ", isRtl ? "تلخيص " : "Summary of ") 
                    : v.topic}
                </p>
                <span className="text-xs text-white/40 mt-1">{new Date(v.created_at).toLocaleDateString()}</span>
              </div>
            </motion.div>
          )) : (
            <div className="p-8 text-center text-white/20 border border-dashed border-white/10 rounded-3xl">
              {t("home_no_dialogues")}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className={cn("text-2xl font-bold mb-4", isRtl && "text-right")}>{t("home_explore_philosophers")}</h2>
        <div className={cn("flex gap-4 overflow-x-auto pb-4 scrollbar-hide", isRtl && "flex-row-reverse")}>
          {PHILOSOPHERS.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-24 text-center">
              <div className="w-24 h-24 rounded-full border-2 border-orange-500/30 p-1 mb-2">
                <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-sm font-medium">{p.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const GenerationContext = createContext<any>(null);
export const useGeneration = () => useContext(GenerationContext);

export const GenerationProvider = ({ children, setCurrentVideo }: { children: React.ReactNode, setCurrentVideo: (v: VideoMetadata) => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language: uiLanguage, isRtl } = useLanguage();
  const [step, setStep] = useState(1);
  const [p1, setP1] = useState<string | null>(null);
  const [p2, setP2] = useState<string | null>(null);
  const [activeSpec, setActiveSpec] = useState("All");
  const [p1Voice, setP1Voice] = useState<string>("Charon");
  const [p2Voice, setP2Voice] = useState<string>("Kore");
  const [p1Avatar, setP1Avatar] = useState({ background: 'podcast_studio', clothes: 'formal_suit', microphone: 'shure_sm7b' });
  const [p2Avatar, setP2Avatar] = useState({ background: 'podcast_studio', clothes: 'formal_suit', microphone: 'shure_sm7b' });
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState<'p1' | 'p2' | null>(null);
  const [p1Desc, setP1Desc] = useState("");
  const [p2Desc, setP2Desc] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [topicSearch, setTopicSearch] = useState("");
  const [isSuggestingTopic, setIsSuggestingTopic] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isSearchingBookAI, setIsSearchingBookAI] = useState(false);
  const [generationLanguage, setGenerationLanguage] = useState(uiLanguage);
  const [isGenLangModalOpen, setIsGenLangModalOpen] = useState(false);
  const genIsRtl = generationLanguage === "ar";
  const [duration, setDuration] = useState(5);
  const [includeMusic, setIncludeMusic] = useState(true);
  const [videoFormat, setVideoFormat] = useState<'landscape' | 'portrait'>('landscape');
  const [userQuestion, setUserQuestion] = useState("");
  const [generationMode, setGenerationMode] = useState<"dialogue" | "book_summary" | "solo">("dialogue");
  const [summaryStyle, setSummaryStyle] = useState<"dialogue" | "monologue">("dialogue");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [socialTitle, setSocialTitle] = useState("");
  const [socialDescription, setSocialDescription] = useState("");
  const [dialogue, setDialogue] = useState<DialogueExchange[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeProgress, setFinalizeProgress] = useState(0);

  const handleSuggestTopic = async () => {
    setIsSuggestingTopic(true);
    try {
      const response = await axios.post("/api/gemini/suggest-topic", {
        generationMode,
        topicSearch,
        languageName: LANGUAGES.find(l => l.id === generationLanguage)?.name || 'English',
        p1,
        p2
      });
      const result = response.data?.topics;
      if (Array.isArray(result) && result.length > 0) {
        setSuggestedTopics(result);
        // Also set the first one as default if none selected
        if (!topic) {
          setTopic(result[0]);
          setTopicSearch(result[0]);
        }
      }
    } catch (error: any) {
      console.error("Failed to suggest topic:", error);
      const errorStr = JSON.stringify(error?.response?.data || error) + (error.message || "");
      if (errorStr.includes('spending cap')) {
        toast.error("Project spending cap exceeded. Please check your Google Cloud billing.");
      } else if (errorStr.includes('429')) {
        toast.error("The AI is currently busy (Quota Exceeded). Please wait a minute and try again.");
      } else {
        toast.error("Failed to suggest topic");
      }
    } finally {
      setIsSuggestingTopic(false);
    }
  };

  const handleSearchBookAI = async () => {
    if (!bookTitle && !topicSearch) {
      toast.error("Please enter a book title or a topic to search for.");
      return;
    }
    setIsSearchingBookAI(true);
    try {
      const response = await axios.post("/api/gemini/search-book", {
        bookTitle,
        topicSearch,
        languageName: LANGUAGES.find(l => l.id === generationLanguage)?.name || 'English'
      });
      const result = response.data;
      if (result && result.title && result.author) {
        setBookTitle(result.title);
        setBookAuthor(result.author);
        toast.success(`Found: ${result.title} by ${result.author}`);
      } else {
        toast.error("Could not find a specific book. Please try again with more details.");
      }
    } catch (error: any) {
      console.error("Failed to search book:", error);
      toast.error("Failed to search for book using AI.");
    } finally {
      setIsSearchingBookAI(false);
    }
  };

  const handleGenerateDialogue = async () => {
    const currentP1 = p1 || (generationMode === "solo" ? "Narrator" : "");
    const currentP2 = p2 || "";
    const currentTopic = topic;

    if (generationMode !== "solo" && !currentP1) return;
    if (generationMode === "dialogue" && !currentP2) return;
    if (generationMode === "dialogue" && !currentTopic) {
      toast.error(t("error_topic_required") || "Please select a topic");
      return;
    }
    if (generationMode === "book_summary" && !bookTitle) {
      toast.error(t("gen_book_title") + " is required");
      return;
    }
    if (generationMode === "solo" && !currentTopic) {
      toast.error(t("error_topic_required") || "Please enter a topic or script");
      return;
    }
    
    let finalTopic = currentTopic;
    if (generationMode === "book_summary") {
      finalTopic = `Summary of ${bookTitle}${bookAuthor ? ` by ${bookAuthor}` : ""}`;
      setTopic(finalTopic);
      setSummaryStyle("monologue"); // Force monologue for book summaries
    }

    if (generationMode === "solo") {
      setSummaryStyle("monologue");
      if (!p1) setP1("Narrator");
    }

    setIsGenerating(true);
    const toastId = toast.loading(t("dialogue_generating") || "Generating dialogue...", { duration: Infinity });
    try {
      let prompt = "";
      if (generationMode === "solo") {
        prompt = `
          You are an expert AI voiceover script generator.
          Your task is to create a compelling, high-quality monologue script for a single narrator.
          The script should be engaging, informative, and viral-friendly.
          
          Core Rule:
          The script MUST start with a strong attention-grabbing hook in the first sentence.
          Do NOT start with greetings or introductions.
          
          Emotion System:
          Each line must include an emotion tag to guide voice tone.
          Use emotions like: (calm), (dramatic), (intense), (thoughtful), (confident), (serious), (curious), (reflective), (challenging), (emotional).
          
          General Rules:
          - No greetings
          - No introductions
          - Strong hook at start
          - Natural human narration
          - Short sentences
          - Small pauses (…) for realism
          - Maximum duration 30–40 seconds
          - End with a thought-provoking closing statement or question
          
          Topic: ${finalTopic}
          Language: ${LANGUAGES.find(l => l.id === generationLanguage)?.name || 'English'}
          ${userQuestion ? `Specific Direction: "${userQuestion}"` : ""}
        `;
      } else {
        prompt = `
          You are an expert AI philosophical podcast script generator for a modern short video application.
          Your task is to create short, engaging, and viral philosophical dialogue between two philosophers in a modern podcast studio.
 
        Core Rule:
        The script MUST start with a strong attention-grabbing hook in the first sentence.
        Do NOT start with greetings or introductions.
        The first line must immediately capture attention with a bold philosophical idea, provocative question, unexpected insight, or debatable claim.
 
        Emotion System:
        Each line must include an emotion tag to guide AI avatar movement and voice tone.
        Use emotions like: (calm), (dramatic), (intense), (thoughtful), (confident), (serious), (curious), (reflective), (challenging), (emotional).
 
        Philosopher Speaking Styles:
        * Socrates: calm, curious, asks deep questions
        * Plato: rational and structured
        * Aristotle: logical and practical
        * Nietzsche: bold and intense
        * Dostoevsky: emotional and psychological
        * Ibn Sina: intellectual and calm
        * Descartes: logical and analytical
        * Kant: structured and moral
        * Confucius: wise and peaceful
        * Any other philosopher: adapt to their authentic style
 
        General Rules:
        - No greetings
        - No introductions
        - Strong hook at start
        - Simple modern language
        - Natural human conversation
        - Short sentences
        - Fast-paced dialogue
        - Small pauses (…) for realism
        - Philosophers must disagree
        - Maximum duration 30–40 seconds
        - End with audience question
 
        Structure:
        Hook -> Reaction -> Debate -> Different perspectives -> Tension -> Ending question
 
        Tone:
        Modern, Podcast style, Engaging, Viral-friendly, Philosophical but simple.
 
        Inputs:
        Philosopher 1: ${currentP1} ${p1Desc ? `(${p1Desc})` : ""}
        Philosopher 2: ${currentP2} ${p2Desc ? `(${p2Desc})` : ""}
        Topic: ${finalTopic}
        Language: ${LANGUAGES.find(l => l.id === generationLanguage)?.name || 'English'}
        ${userQuestion ? `Specific Question/Direction from the user: "${userQuestion}"` : ""}
      `;
      }

      const response = await axios.post("/api/gemini/generate-dialogue", {
        generationMode,
        p1: currentP1,
        p1Desc,
        p2: currentP2,
        p2Desc,
        finalTopic,
        languageName: LANGUAGES.find(l => l.id === generationLanguage)?.name || 'English',
        userQuestion
      });

      const result = response.data;
      setSocialTitle(result.socialTitle || "");
      setSocialDescription(result.socialDescription || "");
      
      let finalDialogue = result.dialogue || [];
      if (result.questionForAudience) {
        const lastSpeaker = finalDialogue.length > 0 ? finalDialogue[finalDialogue.length - 1].speaker : p1;
        finalDialogue.push({
          speaker: lastSpeaker,
          text: result.questionForAudience,
          emotion: "thoughtful"
        });
      }
      setDialogue(finalDialogue);
      
      setStep(5);
      toast.success(t("dialogue_generated_notification") || "Dialogue generated! Review and finalize.", {
        id: toastId,
        action: {
          label: t("view") || "View",
          onClick: () => navigate("/generate")
        },
        duration: 5000
      });
    } catch (error: any) {
      console.error("Generation failed:", error);
      const errorStr = JSON.stringify(error?.response?.data || error) + (error.message || "");
      if (errorStr.includes('spending cap')) {
        toast.error("Project spending cap exceeded. Please check your Google Cloud billing.", { id: toastId, duration: 5000 });
      } else if (errorStr.includes('429')) {
        toast.error("The AI is currently busy (Quota Exceeded). Please wait a minute and try again.", { id: toastId, duration: 5000 });
      } else {
        toast.error("Failed to generate dialogue. Please try again.", { id: toastId, duration: 5000 });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalize = async () => {
    if (dialogue.length === 0) return;
    setIsFinalizing(true);
    setFinalizeProgress(0);
    
    // Create a doc reference first to get the ID for IndexedDB
    const docRef = doc(collection(db, "dialogues"));
    const video_id = docRef.id;
    
    const toastId = toast.loading(t("generation_in_progress") || "Generating video in background...", { duration: Infinity });
    try {
      const CHUNK_SIZE = 5;
      const audioChunks: Uint8Array[] = [];
      
      for (let i = 0; i < dialogue.length; i += CHUNK_SIZE) {
        const chunk = dialogue.slice(i, i + CHUNK_SIZE);
        setFinalizeProgress(Math.round((i / dialogue.length) * 100));
        const isMonologue = generationMode === "book_summary" || generationMode === "solo";
        const ttsPrompt = isMonologue 
          ? `TTS the following monologue by ${p1}:\n` + chunk.map(d => `(${d.emotion}) ${d.text}`).join('\n')
          : `TTS the following conversation between ${p1} and ${p2}:\n` + chunk.map(d => `${d.speaker} (${d.emotion}): ${d.text}`).join('\n');

        let retries = 0;
        const maxRetries = 7;
        let base64Audio = null;

        while (retries <= maxRetries) {
          try {
            const validVoices = ["Charon", "Kore", "Puck", "Zephyr", "Fenrir"];
            const voice1 = validVoices.includes(p1Voice) ? p1Voice : "Charon";
            const voice2 = validVoices.includes(p2Voice) ? p2Voice : "Kore";

            const ttsResponse = await axios.post("/api/gemini/generate-tts", {
              ttsPrompt,
              isMonologue,
              p1: p1 || "",
              p2: p2 || "",
              voice1,
              voice2
            });

            base64Audio = ttsResponse.data?.audioBase64;
            if (base64Audio) break;
            
            retries++;
            await sleep(3000 * Math.pow(2, retries));
          } catch (err: any) {
            console.error(`TTS Chunk ${i} failed (attempt ${retries + 1}):`, err);
            console.log("Problematic prompt:", ttsPrompt);
            const errStr = JSON.stringify(err?.response?.data || err);
            const is429 = 
              err.message?.includes('429') || 
              err.status === 429 || 
              err?.response?.status === 429 ||
              errStr.includes('429') || 
              errStr.includes('RESOURCE_EXHAUSTED');
            
            const is500 =
              err.message?.includes('500') ||
              err.status === 500 ||
              err?.response?.status === 500 ||
              errStr.includes('500') ||
              errStr.includes('INTERNAL');

            if (is429 || is500) {
              retries++;
              if (retries > maxRetries) throw err;
              // Wait longer for 429
              const waitTime = is429 ? 10000 * Math.pow(1.5, retries) : 5000 * Math.pow(2, retries);
              await sleep(waitTime);
            } else {
              throw err;
            }
          }
        }

        if (base64Audio) {
          const binary = atob(base64Audio);
          const bytes = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) {
            bytes[j] = binary.charCodeAt(j);
          }
          audioChunks.push(bytes);
        }

        // Mandatory delay between chunks to avoid rate limits
        await sleep(3000);
      }

      let audio_url = "";
      if (audioChunks.length > 0) {
        const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedPcm = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunks) {
          combinedPcm.set(chunk, offset);
          offset += chunk.length;
        }
        
        const wavBlob = pcmToWav(combinedPcm);
        audio_url = URL.createObjectURL(wavBlob);
        await saveAudioBlob(video_id, wavBlob);
      } else {
        throw new Error("No audio data generated");
      }

      const video_url = ""; // No video yet, will be generated later
      
      const newVideoData = {
        userId: user!.uid,
        authorName: user!.displayName || "Anonymous",
        authorPhoto: user!.photoURL || "",
        philosopher1: p1!,
        philosopher2: p2!,
        topic: topic || `Summary of ${bookTitle}`,
        video_url: video_url,
        audio_url: audio_url,
        dialogue: dialogue,
        generationMode: generationMode,
        socialTitle: socialTitle,
        socialDescription: socialDescription,
        created_at: new Date().toISOString(),
        include_music: includeMusic,
        language: generationLanguage,
        philosopher1Voice: p1Voice,
        philosopher2Voice: p2Voice,
        p1Avatar: p1Avatar,
        p2Avatar: p2Avatar,
        videoFormat: videoFormat,
        isPublic: false,
        likes: 0
      };
      
      try {
        await setDoc(docRef, newVideoData);
      } catch (docErr) {
        console.error("Firestore dialogue save error:", docErr);
        handleFirestoreError(docErr, OperationType.CREATE, `dialogues/${docRef.id}`);
      }
      const newVideo = { id: docRef.id, ...newVideoData };

      setCurrentVideo(newVideo);
      
      // Show notification
      toast.success(t("generation_complete_notification") || "Dialogue generation complete!", {
        id: toastId,
        action: {
          label: t("view") || "View",
          onClick: () => navigate(`/video/${newVideo.id}`)
        },
        duration: 10000
      });
      
      if (window.location.pathname === "/generate") {
        navigate(`/video/${newVideo.id}`);
      }
      
      // Reset state for next generation
      setStep(1);
      setP1(null);
      setP2(null);
      setTopic(null);
      setDialogue([]);
      
    } catch (error: any) {
      console.error("Finalization failed:", error);
      const errorStr = JSON.stringify(error) + (error.message || "");
      if (errorStr.includes('spending cap')) {
        toast.error("Project spending cap exceeded. Please check your Google Cloud billing.", { id: toastId, duration: 5000 });
      } else if (errorStr.includes('429')) {
        toast.error("The AI is currently busy (Quota Exceeded). Please wait a minute and try again.", { id: toastId, duration: 5000 });
      } else if (errorStr.includes('500') || errorStr.includes('INTERNAL')) {
        toast.error("The AI encountered an internal error. We've added retries, but if this persists, try a shorter dialogue.", { id: toastId, duration: 7000 });
      } else {
        toast.error(`Failed to generate audio: ${error.message || "Unknown error"}. Please try again.`, { id: toastId, duration: 5000 });
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <GenerationContext.Provider value={{
      step, setStep, p1, setP1, p2, setP2, activeSpec, setActiveSpec,
      p1Voice, setP1Voice, p2Voice, setP2Voice, p1Desc, setP1Desc, p2Desc, setP2Desc,
      topic, setTopic, topicSearch, setTopicSearch, isSuggestingTopic, setIsSuggestingTopic,
      generationLanguage, setGenerationLanguage, isGenLangModalOpen, setIsGenLangModalOpen,
      genIsRtl, duration, setDuration, includeMusic, setIncludeMusic, videoFormat, setVideoFormat, userQuestion, setUserQuestion,
      p1Avatar, setP1Avatar, p2Avatar, setP2Avatar, showAvatarCustomizer, setShowAvatarCustomizer,
      generationMode, setGenerationMode, summaryStyle, setSummaryStyle, bookTitle, setBookTitle, bookAuthor, setBookAuthor,
      isSearchingBookAI, handleSearchBookAI,
      suggestedTopics, setSuggestedTopics,
      socialTitle, setSocialTitle, socialDescription, setSocialDescription,
      dialogue, setDialogue, isGenerating, setIsGenerating, isFinalizing, setIsFinalizing,
      finalizeProgress, setFinalizeProgress, handleSuggestTopic, handleGenerateDialogue, handleFinalize
    }}>
      {children}
    </GenerationContext.Provider>
  );
};

const GenerateScreen = () => {
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();
  const {
    step, setStep, p1, setP1, p2, setP2, activeSpec, setActiveSpec,
    p1Voice, setP1Voice, p2Voice, setP2Voice, p1Desc, setP1Desc, p2Desc, setP2Desc,
    topic, setTopic, topicSearch, setTopicSearch, isSuggestingTopic,
    generationLanguage, setGenerationLanguage, isGenLangModalOpen, setIsGenLangModalOpen,
    genIsRtl, duration, setDuration, includeMusic, setIncludeMusic, videoFormat, setVideoFormat, userQuestion, setUserQuestion,
    p1Avatar, setP1Avatar, p2Avatar, setP2Avatar, showAvatarCustomizer, setShowAvatarCustomizer,
    generationMode, setGenerationMode, summaryStyle, setSummaryStyle, bookTitle, setBookTitle, bookAuthor, setBookAuthor,
    isSearchingBookAI, handleSearchBookAI,
    suggestedTopics,
    socialTitle, setSocialTitle, socialDescription, setSocialDescription,
    dialogue, setDialogue, isGenerating, isFinalizing,
    finalizeProgress, handleSuggestTopic, handleGenerateDialogue, handleFinalize
  } = useGeneration();

  const [fetchedTopics, setFetchedTopics] = useState<any[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get(`/api/topics`);
        setFetchedTopics(response.data);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    fetchTopics();
  }, []);

  if (isGenerating) {
    const p1Data = PHILOSOPHERS.find(p => p.name === p1);
    const p2Data = PHILOSOPHERS.find(p => p.name === p2);
    const p1Avatar = p1Data?.avatar || `https://picsum.photos/seed/${p1}/200/200`;
    const p2Avatar = p2Data?.avatar || `https://picsum.photos/seed/${p2}/200/200`;

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
        <div className={cn("flex items-center gap-4 mb-12", isRtl && "flex-row-reverse")}>
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 rounded-full border-2 border-orange-500 p-1"
          >
            <img src={p1Avatar} className="w-full h-full rounded-full object-cover" alt={p1!} />
          </motion.div>
          <div className="text-orange-500 font-bold text-xl">VS</div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="w-24 h-24 rounded-full border-2 border-orange-500 p-1"
          >
            <img src={p2Avatar} className="w-full h-full rounded-full object-cover" alt={p2!} />
          </motion.div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">{t("generate_loading_dialogue")}</h2>
        <p className="text-white/60 text-sm max-w-xs">
          {t("generate_loading_dialogue_desc").replace("{p1}", p1!).replace("{p2}", p2!)}
        </p>
        <div className="mt-10 w-full max-w-xs bg-white/10 h-1 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 45 }}
            className="h-full bg-orange-500"
          />
        </div>
      </div>
    );
  }

  if (isFinalizing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
        <div className="relative w-32 h-32 mb-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-orange-500/20 rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-4 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.4)]"
          >
            <Music size={40} className="text-white" />
          </motion.div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">{t("video_producing_audio")}</h2>
        <p className="text-white/60 text-sm max-w-xs mb-8">
          {t("video_generating_dialogue")}
        </p>
        
        <div className="w-full max-w-xs bg-white/10 h-1 rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${finalizeProgress}%` }}
            className="h-full bg-orange-500"
          />
        </div>
        <div className="text-[10px] text-white/40 uppercase tracking-widest">
          {t("gen_progress")}: {finalizeProgress}%
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6", isRtl && "text-right")} dir={isRtl ? "rtl" : "ltr"}>
      <Header title={t("gen_header")} showBack />
      
      {step > 1 && !showAvatarCustomizer && (
        <button 
          onClick={() => {
            if (generationMode === "solo" && step === 3) {
              navigate("/");
            } else if (generationMode === "book_summary" && step === 3) {
              setStep(1);
            } else {
              setStep(step - 1);
            }
          }}
          className={cn("flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4", isRtl && "flex-row-reverse")}
        >
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          <span className="text-sm font-medium">{t("common_back") || "Back"}</span>
        </button>
      )}
      
      <div className="mb-8">
        <div className={cn("flex gap-2 mb-6", isRtl && "flex-row-reverse")}>
          {(generationMode === "solo" ? [3, 4, 5] : (generationMode === "book_summary" ? [1, 3, 4, 5] : [1, 2, 3, 4, 5])).map((s) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-orange-500" : "bg-white/10")} />
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          {step === 1 && showAvatarCustomizer !== 'p1' && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-2">
                {generationMode === "book_summary" ? t("gen_step_1_title_monologue") : t("gen_step_1_title")}
              </h2>
              <p className="text-white/60 text-sm mb-6">
                {generationMode === "book_summary" ? t("gen_step_1_desc_monologue") : t("gen_step_1_desc")}
              </p>
              
              {/* Specialization Filter */}
              <div className={cn("flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar", isRtl && "flex-row-reverse")}>
                {SPECIALIZATIONS.map(spec => (
                  <button
                    key={spec}
                    onClick={() => setActiveSpec(spec)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                      activeSpec === spec ? "bg-orange-500 border-orange-500 text-white" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {PHILOSOPHERS.filter(p => activeSpec === "All" || p.specialization === activeSpec).map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => { 
                      setP1(p.name); 
                      setP1Voice(p.defaultVoice);
                    }}
                    className={cn(
                      "p-3 rounded-2xl border transition-all text-center flex flex-col items-center group",
                      p1 === p.name ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"
                    )}
                  >
                    <div className="relative">
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full mb-2 object-cover transition-transform group-hover:scale-110" />
                      <div className={cn("absolute -top-1 px-1 py-0.5 bg-orange-500 text-[7px] rounded-full font-bold uppercase", isRtl ? "-left-1" : "-right-1")}>{p.era}</div>
                    </div>
                    <span className="font-medium block text-xs">{p.name}</span>
                    <div className="mt-1 text-[7px] text-orange-500/60 font-bold uppercase tracking-widest">{p.specialization}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] text-white/20 uppercase tracking-widest">{t("gen_custom_name")}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className={cn("flex flex-col gap-2", isRtl && "flex-col")}>
                  <input 
                    type="text"
                    placeholder={t("gen_enter_name")}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    value={p1 || ""}
                    onChange={(e) => setP1(e.target.value)}
                  />
                  <textarea 
                    placeholder={t("gen_enter_desc")}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-orange-500 transition-colors min-h-[60px] resize-none"
                    value={p1Desc}
                    onChange={(e) => setP1Desc(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if (p1) {
                        setShowAvatarCustomizer('p1');
                      }
                    }}
                    disabled={!p1}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {t("customize_avatar") || "Customize Avatar"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && showAvatarCustomizer === 'p1' && (
            <motion.div key="avatar-p1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-2">
                <button 
                  onClick={() => setShowAvatarCustomizer(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {isRtl ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
                </button>
                <h2 className="text-2xl font-bold">Customize {p1}'s Avatar</h2>
              </div>
              <p className="text-white/60 text-sm mb-6">Select the studio environment and props for {p1}.</p>
              
              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Background Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">Studio Background</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVATAR_BACKGROUNDS.map(bg => (
                      <button
                        key={bg.id}
                        onClick={() => setP1Avatar({...p1Avatar, background: bg.id})}
                        className={cn("p-3 rounded-xl border transition-all flex items-center gap-3 text-left", p1Avatar.background === bg.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5")}
                      >
                        <span className="text-2xl">{bg.icon}</span>
                        <span className="text-sm font-medium">{bg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Clothes Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">Clothing Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVATAR_CLOTHES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setP1Avatar({...p1Avatar, clothes: c.id})}
                        className={cn("p-3 rounded-xl border transition-all flex items-center gap-3 text-left", p1Avatar.clothes === c.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5")}
                      >
                        <span className="text-2xl">{c.icon}</span>
                        <span className="text-sm font-medium">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Microphone Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">Microphone</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVATAR_MICROPHONES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setP1Avatar({...p1Avatar, microphone: m.id})}
                        className={cn("p-3 rounded-xl border transition-all flex items-center gap-3 text-left", p1Avatar.microphone === m.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5")}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <span className="text-sm font-medium">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setShowAvatarCustomizer(null);
                  if (generationMode === "book_summary") {
                    setStep(3);
                  } else {
                    setStep(2); 
                  }
                }}
                className={cn("w-full mt-8 bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2", isRtl && "flex-row-reverse")}
              >
                {t("gen_continue_settings")} {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
              </button>
            </motion.div>
          )}

          {step === 2 && showAvatarCustomizer !== 'p2' && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t("gen_step_2_title")}</h2>
              <p className="text-white/60 text-sm mb-6">{t("gen_step_2_desc", { p1: p1! })}</p>
              
              {/* Specialization Filter */}
              <div className={cn("flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar", isRtl && "flex-row-reverse")}>
                {SPECIALIZATIONS.map(spec => (
                  <button
                    key={spec}
                    onClick={() => setActiveSpec(spec)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                      activeSpec === spec ? "bg-orange-500 border-orange-500 text-white" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {PHILOSOPHERS.filter(p => p.name !== p1 && (activeSpec === "All" || p.specialization === activeSpec)).map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => { 
                      setP2(p.name); 
                      setP2Voice(p.defaultVoice);
                    }}
                    className={cn(
                      "p-3 rounded-2xl border transition-all text-center flex flex-col items-center group",
                      p2 === p.name ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"
                    )}
                  >
                    <div className="relative">
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full mb-2 object-cover transition-transform group-hover:scale-110" />
                      <div className={cn("absolute -top-1 px-1 py-0.5 bg-orange-500 text-[7px] rounded-full font-bold uppercase", isRtl ? "-left-1" : "-right-1")}>{p.era}</div>
                    </div>
                    <span className="font-medium block text-xs">{p.name}</span>
                    <div className="mt-1 text-[7px] text-orange-500/60 font-bold uppercase tracking-widest">{p.specialization}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] text-white/20 uppercase tracking-widest">{t("generate_custom_name")}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className={cn("flex flex-col gap-2", isRtl && "flex-col")}>
                  <input 
                    type="text"
                    placeholder={t("generate_name_placeholder")}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    value={p2 || ""}
                    onChange={(e) => setP2(e.target.value)}
                  />
                  <textarea 
                    placeholder={t("generate_desc_placeholder")}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-orange-500 transition-colors min-h-[60px] resize-none"
                    value={p2Desc}
                    onChange={(e) => setP2Desc(e.target.value)}
                  />
                  <button 
                    onClick={() => p2 && setShowAvatarCustomizer('p2')}
                    disabled={!p2}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {t("customize_avatar") || "Customize Avatar"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && showAvatarCustomizer === 'p2' && (
            <motion.div key="avatar-p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-2">
                <button 
                  onClick={() => setShowAvatarCustomizer(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {isRtl ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
                </button>
                <h2 className="text-2xl font-bold">Customize {p2}'s Avatar</h2>
              </div>
              <p className="text-white/60 text-sm mb-6">Select the studio environment and props for {p2}.</p>
              
              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Background Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">Studio Background</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVATAR_BACKGROUNDS.map(bg => (
                      <button
                        key={bg.id}
                        onClick={() => setP2Avatar({...p2Avatar, background: bg.id})}
                        className={cn("p-3 rounded-xl border transition-all flex items-center gap-3 text-left", p2Avatar.background === bg.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5")}
                      >
                        <span className="text-2xl">{bg.icon}</span>
                        <span className="text-sm font-medium">{bg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Clothes Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">Clothing Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVATAR_CLOTHES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setP2Avatar({...p2Avatar, clothes: c.id})}
                        className={cn("p-3 rounded-xl border transition-all flex items-center gap-3 text-left", p2Avatar.clothes === c.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5")}
                      >
                        <span className="text-2xl">{c.icon}</span>
                        <span className="text-sm font-medium">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Microphone Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">Microphone</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVATAR_MICROPHONES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setP2Avatar({...p2Avatar, microphone: m.id})}
                        className={cn("p-3 rounded-xl border transition-all flex items-center gap-3 text-left", p2Avatar.microphone === m.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5")}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <span className="text-sm font-medium">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setShowAvatarCustomizer(null);
                  setStep(3);
                }}
                className={cn("w-full mt-8 bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2", isRtl && "flex-row-reverse")}
              >
                {t("gen_continue_settings")} {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{generationMode === "solo" ? (t("gen_step_3_title_solo") || "Select Voice") : t("gen_step_3_title")}</h2>
              <p className="text-white/60 text-sm mb-8">{generationMode === "solo" ? (t("gen_step_3_desc_solo") || "Choose the voice for your solo narration.") : t("gen_step_3_desc")}</p>
              
              <div className="space-y-8">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4 block">
                    {generationMode === "solo" ? (t("gen_voice_label_solo") || "Voice Selection") : `${p1} ${t("gen_voice_label")}`}
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                    {VOICES.map((v) => (
                      <button 
                        key={v.id}
                        onClick={() => setP1Voice(v.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all flex items-center justify-between group",
                          p1Voice === v.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"
                        )}
                      >
                        <div className={cn("text-left", isRtl && "text-right")}>
                          <div className={cn("font-bold flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                            {v.name}
                            <span className={cn(
                              "text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest",
                              v.gender === "Male" ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400"
                            )}>
                              {v.gender === "Male" ? t("common_male") : t("common_female")}
                            </span>
                          </div>
                        </div>
                        {p1Voice === v.id && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {!(generationMode === "book_summary" || generationMode === "solo") && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4 block">{p2} {t("gen_voice_label")}</label>
                    <div className="grid grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                      {VOICES.map((v) => (
                        <button 
                          key={v.id}
                          onClick={() => setP2Voice(v.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all flex items-center justify-between group",
                            p2Voice === v.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"
                          )}
                        >
                          <div className={cn("text-left", isRtl && "text-right")}>
                            <div className={cn("font-bold flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                              {v.name}
                              <span className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest",
                                v.gender === "Male" ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400"
                              )}>
                                {v.gender === "Male" ? t("common_male") : t("common_female")}
                              </span>
                            </div>
                          </div>
                          {p2Voice === v.id && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setStep(4)}
                className={cn("w-full mt-10 bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2", isRtl && "flex-row-reverse")}
              >
                {t("gen_continue_settings")} {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t("gen_step_4_title")}</h2>
              <p className="text-white/60 text-sm mb-6">{t("gen_step_4_desc")}</p>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4 block">{t("gen_language")}</label>
                  <button
                    onClick={() => setIsGenLangModalOpen(true)}
                    className={cn(
                      "w-full p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between transition-colors hover:bg-white/10",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                      <span className="text-2xl">{LANGUAGES.find(l => l.id === generationLanguage)?.flag}</span>
                      <span className="font-medium text-lg">{LANGUAGES.find(l => l.id === generationLanguage)?.name}</span>
                    </div>
                    <ChevronRight size={20} className={cn("text-white/40", isRtl && "rotate-180")} />
                  </button>
                </div>

                <div>
                  <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
                    <label className="text-xs font-bold uppercase tracking-widest text-orange-500">{t("gen_duration", { duration: duration.toString() })}</label>
                  </div>
                  <input 
                    type="range"
                    min="2"
                    max="60"
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className={cn("flex justify-between mt-2 text-[10px] text-white/20 uppercase tracking-widest", isRtl && "flex-row-reverse")}>
                    <span>{t("gen_min", { min: "2" })}</span>
                    <span>{t("gen_min", { min: "30" })}</span>
                    <span>{t("gen_min", { min: "60" })}</span>
                  </div>
                </div>

                <div className={cn("flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl", isRtl && "flex-row-reverse")}>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <div className="font-bold text-sm">{t("gen_bg_music")}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">{t("gen_bg_music_desc")}</div>
                  </div>
                  <button 
                    onClick={() => setIncludeMusic(!includeMusic)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      includeMusic ? "bg-orange-500" : "bg-white/10"
                    )}
                  >
                    <motion.div 
                      animate={{ x: includeMusic ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                {/* Video Format Selection */}
                <div>
                  <label className={cn("text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block", isRtl && "text-right")}>
                    {t("video_format") || "Video Format"}
                  </label>
                  <div className={cn("grid grid-cols-2 gap-3", isRtl && "flex-row-reverse")}>
                    <button
                      onClick={() => setVideoFormat('landscape')}
                      className={cn(
                        "p-4 rounded-xl border transition-all flex flex-col items-center gap-2", 
                        videoFormat === 'landscape' ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"
                      )}
                    >
                      <div className="w-12 h-8 border-2 border-current rounded-sm" />
                      <span className="text-sm font-medium">Landscape (16:9)</span>
                    </button>
                    <button
                      onClick={() => setVideoFormat('portrait')}
                      className={cn(
                        "p-4 rounded-xl border transition-all flex flex-col items-center gap-2", 
                        videoFormat === 'portrait' ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"
                      )}
                    >
                      <div className="w-8 h-12 border-2 border-current rounded-sm" />
                      <span className="text-sm font-medium">Portrait (9:16)</span>
                    </button>
                  </div>
                </div>
              </div>

              {generationMode === "solo" ? (
                <>
                  <h2 className="text-xl font-bold mb-2">{t("gen_solo_topic") || "What is your voiceover about?"}</h2>
                  <p className="text-white/60 text-sm mb-6">{t("gen_solo_topic_desc") || "Enter a topic or paste your script directly."}</p>
                  
                  <textarea 
                    placeholder={t("gen_solo_placeholder") || "Enter topic or paste script here..."}
                    className={cn(
                      "w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-orange-500 transition-colors text-sm min-h-[150px] resize-none",
                      isRtl && "text-right"
                    )}
                    value={topic || ""}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </>
              ) : generationMode === "dialogue" ? (
                <>
                  <h2 className="text-xl font-bold mb-2">{t("gen_topic_ask")}</h2>
                  <p className="text-white/60 text-sm mb-6">{t("gen_topic_desc")}</p>
                  
                  <div className="relative mb-6">
                    <div className={cn("absolute inset-y-0 flex items-center px-4 pointer-events-none text-white/40", isRtl ? "right-0" : "left-0")}>
                      <Search size={18} />
                    </div>
                    <input 
                      type="text"
                      placeholder={t("gen_topic_search")}
                      className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-2xl py-4 focus:outline-none focus:border-orange-500 transition-colors text-sm",
                        isRtl ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
                      )}
                      value={topicSearch}
                      onChange={(e) => {
                        setTopicSearch(e.target.value);
                        setTopic(e.target.value);
                      }}
                    />
                    <button 
                      onClick={handleSuggestTopic}
                      disabled={isSuggestingTopic}
                      className={cn(
                        "absolute inset-y-2 flex items-center px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50",
                        isRtl ? "left-2" : "right-2"
                      )}
                    >
                      {isSuggestingTopic ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} className={isRtl ? "ml-1" : "mr-1"} />
                      )}
                      {isSuggestingTopic ? t("gen_suggesting") : t("gen_ask_gemini")}
                    </button>
                  </div>

                  {suggestedTopics.length > 0 && (
                    <div className="mb-6">
                      <label className={cn("text-[10px] text-white/20 uppercase tracking-widest mb-3 block", isRtl && "text-right")}>
                        {isRtl ? "اقتراحات الذكاء الاصطناعي" : "AI Suggestions"}
                      </label>
                      <div className={cn("flex flex-wrap gap-2", isRtl && "flex-row-reverse")}>
                        {suggestedTopics.map((s_topic, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setTopic(s_topic);
                              setTopicSearch(s_topic);
                            }}
                            className={cn(
                              "px-4 py-2 rounded-full text-xs font-medium transition-all border",
                              topic === s_topic ? "bg-orange-500 border-orange-500 text-white" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                            )}
                          >
                            {s_topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={cn("flex flex-col gap-3 mb-8", isRtl && "items-end")}>
                    {fetchedTopics.length > 0 ? (
                      fetchedTopics.filter(t_item => t_item.name.toLowerCase().includes(topicSearch.toLowerCase())).map((t_item) => (
                        <button 
                          key={t_item.id}
                          onClick={() => {
                            setTopic(t_item.name);
                            setTopicSearch(t_item.name);
                          }}
                          className={cn(
                            "w-full p-4 rounded-2xl border transition-all text-left",
                            topic === t_item.name ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                            isRtl && "text-right"
                          )}
                        >
                          <div className={cn("flex justify-between items-center mb-1", isRtl && "flex-row-reverse")}>
                            <span className={cn("font-bold text-lg", topic === t_item.name ? "text-orange-500" : "text-white")}>
                              {t_item.name}
                            </span>
                            {topic === t_item.name && <Check size={20} className="text-orange-500" />}
                          </div>
                          <p className="text-white/70 text-sm mb-2">{t_item.description}</p>
                          {topic === t_item.name && (
                            <div className="p-3 bg-black/30 rounded-lg border border-white/5 mt-3">
                              <div className={cn("flex items-center gap-2 mb-1", isRtl && "flex-row-reverse")}>
                                <MessageSquareIcon size={14} className="text-orange-500" />
                                <span className="text-xs font-bold text-orange-500/80 uppercase tracking-wider">Example Dialogue</span>
                              </div>
                              <p className="text-white/90 text-sm italic">"{t_item.example}"</p>
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="flex justify-center py-4">
                        <Loader2 size={24} className="animate-spin text-orange-500" />
                      </div>
                    )}
                    
                    {topicSearch && !fetchedTopics.some(t_item => t_item.name.toLowerCase() === topicSearch.toLowerCase()) && (
                       <button 
                        onClick={() => setTopic(topicSearch)}
                        className={cn(
                          "px-6 py-3 rounded-full border transition-all font-medium text-sm self-start",
                          topic === topicSearch ? "border-orange-500 bg-orange-500 text-white" : "border-white/10 bg-white/5 text-white/80"
                        )}
                      >
                        "{topicSearch}"
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-2">{t("mode_book_summary")}</h2>
                  <p className="text-white/60 text-sm mb-6">{t("mode_book_summary_desc")}</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="relative">
                      <label className={cn("text-xs font-bold uppercase tracking-widest text-orange-500 mb-2 block", isRtl && "text-right")}>{t("gen_book_title")}</label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder={t("gen_book_title")}
                          className={cn(
                            "w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-32 focus:outline-none focus:border-orange-500 transition-colors text-sm",
                            isRtl && "text-right pr-4 pl-32"
                          )}
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                        />
                        <button 
                          onClick={handleSearchBookAI}
                          disabled={isSearchingBookAI}
                          className={cn(
                            "absolute inset-y-2 flex items-center px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50",
                            isRtl ? "left-2" : "right-2"
                          )}
                        >
                          {isSearchingBookAI ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Sparkles size={14} className={isRtl ? "ml-1" : "mr-1"} />
                          )}
                          {isSearchingBookAI ? t("gen_searching") || "Searching..." : t("gen_ask_gemini")}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={cn("text-xs font-bold uppercase tracking-widest text-orange-500 mb-2 block", isRtl && "text-right")}>{t("gen_book_author")}</label>
                      <input 
                        type="text"
                        placeholder={t("gen_book_author")}
                        className={cn(
                          "w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-orange-500 transition-colors text-sm",
                          isRtl && "text-right"
                        )}
                        value={bookAuthor}
                        onChange={(e) => setBookAuthor(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="mb-8">
                <label className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4 block">{t("gen_ask_question")}</label>
                <textarea 
                  placeholder={t("gen_ask_placeholder")}
                  className={cn("w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500 transition-colors min-h-[100px] resize-none", isRtl && "text-right")}
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                />
              </div>

              <button 
                disabled={generationMode === "book_summary" ? !bookTitle : !topic}
                onClick={handleGenerateDialogue}
                className={cn("w-full mt-4 bg-orange-500 text-white py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", isRtl && "flex-row-reverse")}
              >
                {t("gen_generate_btn")} <Sparkles size={20} />
              </button>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t("gen_step_5_title")}</h2>
              <p className="text-white/60 text-sm mb-6">{t("gen_step_5_desc")}</p>
              
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {dialogue.map((item, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className={cn("flex items-center justify-between mb-2", genIsRtl && "flex-row-reverse")}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-500">{item.speaker}</span>
                        <select 
                          value={item.emotion}
                          onChange={(e) => {
                            const newDialogue = [...dialogue];
                            newDialogue[index].emotion = e.target.value;
                            setDialogue(newDialogue);
                          }}
                          className="bg-white/10 border-none text-[10px] text-white/60 rounded px-2 py-1 focus:outline-none"
                        >
                          {["calm", "dramatic", "intense", "thoughtful", "confident", "serious", "curious", "reflective", "challenging", "emotional"].map(emo => (
                            <option key={emo} value={emo} className="bg-zinc-900">{emo}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={async () => {
                            await navigator.clipboard.writeText(item.text);
                            toast.success(t("link_copied") || "Copied to clipboard!");
                          }}
                          className="text-white/20 hover:text-orange-500 transition-colors"
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            const newDialogue = [...dialogue];
                            newDialogue.splice(index, 1);
                            setDialogue(newDialogue);
                          }}
                          className="text-white/20 hover:text-red-500 transition-colors"
                          title={t("gen_remove_line")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <textarea 
                      className={cn("w-full bg-transparent border-none text-sm text-white/80 focus:outline-none resize-none min-h-[60px]", genIsRtl && "text-right")}
                      value={item.text}
                      onChange={(e) => {
                        const newDialogue = [...dialogue];
                        newDialogue[index].text = e.target.value;
                        setDialogue(newDialogue);
                      }}
                    />
                  </div>
                ))}
                
                <button 
                  onClick={() => {
                    setDialogue([...dialogue, { speaker: p1!, text: "", emotion: "thoughtful" }]);
                  }}
                  className={cn("w-full py-3 border border-dashed border-white/10 rounded-2xl text-xs text-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2", genIsRtl && "flex-row-reverse")}
                >
                  <Plus size={14} /> {t("gen_add_line", { p: p1! })}
                </button>
                <button 
                  onClick={() => {
                    setDialogue([...dialogue, { speaker: p2!, text: "", emotion: "thoughtful" }]);
                  }}
                  className={cn("w-full py-3 border border-dashed border-white/10 rounded-2xl text-xs text-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2", genIsRtl && "flex-row-reverse")}
                >
                  <Plus size={14} /> {t("gen_add_line", { p: p2! })}
                </button>

                {/* Social Media Content Preview/Edit */}
                <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
                  <h3 className={cn("text-sm font-bold uppercase tracking-widest text-orange-500 flex items-center gap-2", isRtl && "flex-row-reverse")}>
                    <Share2 size={16} /> {isRtl ? "محتوى وسائل التواصل" : "Social Media Content"}
                  </h3>
                  
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block", isRtl && "text-right")}>
                      {isRtl ? "عنوان مقترح" : "Suggested Title"}
                    </label>
                    <input 
                      type="text"
                      className={cn("w-full bg-transparent border-none text-sm font-bold text-white focus:outline-none", isRtl && "text-right")}
                      value={socialTitle}
                      onChange={(e) => setSocialTitle(e.target.value)}
                      placeholder={isRtl ? "أدخل عنواناً..." : "Enter a title..."}
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block", isRtl && "text-right")}>
                      {isRtl ? "وصف مقترح" : "Suggested Description"}
                    </label>
                    <textarea 
                      className={cn("w-full bg-transparent border-none text-sm text-white/80 focus:outline-none resize-none min-h-[100px]", isRtl && "text-right")}
                      value={socialDescription}
                      onChange={(e) => setSocialDescription(e.target.value)}
                      placeholder={isRtl ? "أدخل وصفاً..." : "Enter a description..."}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <div className={cn("flex gap-4", isRtl && "flex-row-reverse")}>
                  <button 
                    onClick={() => setStep(4)}
                    className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold"
                  >
                    {t("gen_back")}
                  </button>
                  <button 
                    disabled={isFinalizing || dialogue.length === 0}
                    onClick={handleFinalize}
                    className={cn("flex-[2] bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50", isRtl && "flex-row-reverse")}
                  >
                    {isFinalizing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" /> {t("gen_finalizing")}
                      </>
                    ) : (
                      <>
                        {t("gen_finalize_btn")} <Sparkles size={20} />
                      </>
                    )}
                  </button>
                </div>
                <button 
                  onClick={handleGenerateDialogue}
                  disabled={isGenerating}
                  className={cn("w-full py-3 text-xs text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2", isRtl && "flex-row-reverse")}
                >
                  <motion.div animate={isGenerating ? { rotate: 360 } : {}} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles size={14} />
                  </motion.div>
                  {t("gen_regenerate")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isGenLangModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGenLangModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#141414] border-t border-white/10 rounded-t-3xl z-[60] p-5 pb-8"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-4 text-center">{t('gen_language')}</h3>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setGenerationLanguage(lang.id);
                      setIsGenLangModalOpen(false);
                    }}
                    className={cn(
                      "w-full p-3 rounded-2xl border transition-all flex items-center justify-between",
                      generationLanguage === lang.id 
                        ? "bg-orange-500/10 border-orange-500/50 text-orange-500" 
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium text-base">{lang.name}</span>
                    </div>
                    {generationLanguage === lang.id && <Check size={18} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const PodcastSimulator = ({ video, currentLine, isPlaying, p1AvatarUrl, p2AvatarUrl, p1Avatar, p2Avatar, audioVolume = 0 }: any) => {
  const isSolo = video.generationMode === "solo" || (video.generationMode === "book_summary" && (!video.philosopher2 || video.philosopher2 === "None"));
  const isP1Speaking = currentLine?.speaker === video.philosopher1 || isSolo;
  const isP2Speaking = !isSolo && currentLine?.speaker === video.philosopher2;
  const isPortrait = video.videoFormat === 'portrait';

  const reactScale = 1 + (audioVolume / 255) * 0.15;
  const waveOpacity = audioVolume / 255;
  const waveScale = 1 + (audioVolume / 255) * 0.5;

  const getAvatarIcon = (type: string, id: string) => {
    if (type === 'bg') return AVATAR_BACKGROUNDS.find(b => b.id === id)?.icon || '';
    if (type === 'clothes') return AVATAR_CLOTHES.find(c => c.id === id)?.icon || '';
    if (type === 'mic') return AVATAR_MICROPHONES.find(m => m.id === id)?.icon || '';
    return '';
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#111]">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover blur-sm"
          alt="podcast studio"
        />
      </div>

      {/* Split Screen or Dynamic Camera */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center p-4 md:p-8 gap-4 md:gap-8 transition-all duration-1000",
        isPortrait ? "flex-col" : "flex-row"
      )}>
        {/* Philosopher 1 */}
        <div className={cn(
          "relative flex flex-col items-center justify-center transition-all duration-700 ease-in-out",
          isSolo ? "w-full h-full max-w-md" : (isP1Speaking ? (isPortrait ? "h-2/3 z-10" : "w-2/3 z-10") : (isPortrait ? "h-1/3 opacity-50 z-0" : "w-1/3 opacity-50 z-0")),
          !isSolo && !isP1Speaking && !isP2Speaking && (isPortrait ? "h-1/2 opacity-100" : "w-1/2 opacity-100")
        )}>
          {/* Sound Waves */}
          {isP1Speaking && isPlaying && (
            <>
              <div 
                className="absolute rounded-full border-4 border-orange-500 z-0"
                style={{
                  width: '100%', height: '100%', maxWidth: '300px',
                  transform: `scale(${waveScale})`,
                  opacity: waveOpacity,
                  transition: 'transform 0.05s, opacity 0.05s'
                }}
              />
              <div 
                className="absolute rounded-full border-2 border-orange-500 z-0"
                style={{
                  width: '100%', height: '100%', maxWidth: '300px',
                  transform: `scale(${waveScale * 1.2})`,
                  opacity: waveOpacity * 0.5,
                  transition: 'transform 0.05s, opacity 0.05s'
                }}
              />
            </>
          )}

          <div 
            className={cn(
              "relative w-full aspect-square max-w-[300px] rounded-full md:rounded-3xl overflow-hidden border-4 transition-colors duration-500 shadow-2xl bg-zinc-900",
              isP1Speaking ? "border-orange-500" : "border-white/10"
            )}
            style={{
              transform: isP1Speaking ? `scale(${reactScale})` : 'scale(0.95)',
              transition: isP1Speaking ? 'transform 0.05s' : 'transform 0.5s'
            }}
          >
            {/* Custom Background */}
            {p1Avatar?.background && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30 text-[150px]">
                {getAvatarIcon('bg', p1Avatar.background)}
              </div>
            )}
            <img src={p1AvatarUrl} className="w-full h-full object-cover relative z-10" alt={video.philosopher1} />
            
            {/* Custom Clothes Overlay */}
            {p1Avatar?.clothes && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[100px] z-20 leading-none">
                {getAvatarIcon('clothes', p1Avatar.clothes)}
              </div>
            )}
            
            {/* Custom Mic Overlay */}
            {p1Avatar?.microphone && (
              <div className="absolute bottom-4 right-4 text-[60px] z-30 drop-shadow-lg">
                {getAvatarIcon('mic', p1Avatar.microphone)}
              </div>
            )}

            {isP1Speaking && isPlaying && (
              <div className="absolute inset-0 bg-orange-500/10 animate-pulse mix-blend-overlay z-40" />
            )}
          </div>
          <div className="mt-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <span className="text-xs font-bold uppercase tracking-widest text-white">{video.philosopher1}</span>
          </div>
        </div>

        {/* Philosopher 2 */}
        {!isSolo && (
          <div className={cn(
            "relative flex flex-col items-center justify-center transition-all duration-700 ease-in-out",
            isP2Speaking ? (isPortrait ? "h-2/3 z-10" : "w-2/3 z-10") : (isPortrait ? "h-1/3 opacity-50 z-0" : "w-1/3 opacity-50 z-0"),
            !isP1Speaking && !isP2Speaking && (isPortrait ? "h-1/2 opacity-100" : "w-1/2 opacity-100")
          )}>
            {/* Sound Waves */}
            {isP2Speaking && isPlaying && (
              <>
                <div 
                  className="absolute rounded-full border-4 border-blue-500 z-0"
                  style={{
                    width: '100%', height: '100%', maxWidth: '300px',
                    transform: `scale(${waveScale})`,
                    opacity: waveOpacity,
                    transition: 'transform 0.05s, opacity 0.05s'
                  }}
                />
                <div 
                  className="absolute rounded-full border-2 border-blue-500 z-0"
                  style={{
                    width: '100%', height: '100%', maxWidth: '300px',
                    transform: `scale(${waveScale * 1.2})`,
                    opacity: waveOpacity * 0.5,
                    transition: 'transform 0.05s, opacity 0.05s'
                  }}
                />
              </>
            )}

            <div 
              className={cn(
                "relative w-full aspect-square max-w-[300px] rounded-full md:rounded-3xl overflow-hidden border-4 transition-colors duration-500 shadow-2xl bg-zinc-900",
                isP2Speaking ? "border-blue-500" : "border-white/10"
              )}
              style={{
                transform: isP2Speaking ? `scale(${reactScale})` : 'scale(0.95)',
                transition: isP2Speaking ? 'transform 0.05s' : 'transform 0.5s'
              }}
            >
              {/* Custom Background */}
              {p2Avatar?.background && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 text-[150px]">
                  {getAvatarIcon('bg', p2Avatar.background)}
                </div>
              )}
              <img src={p2AvatarUrl} className="w-full h-full object-cover relative z-10" alt={video.philosopher2} />
              
              {/* Custom Clothes Overlay */}
              {p2Avatar?.clothes && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[100px] z-20 leading-none">
                  {getAvatarIcon('clothes', p2Avatar.clothes)}
                </div>
              )}
              
              {/* Custom Mic Overlay */}
              {p2Avatar?.microphone && (
                <div className="absolute bottom-4 right-4 text-[60px] z-30 drop-shadow-lg">
                  {getAvatarIcon('mic', p2Avatar.microphone)}
                </div>
              )}

              {isP2Speaking && isPlaying && (
                <div className="absolute inset-0 bg-blue-500/10 animate-pulse mix-blend-overlay z-40" />
              )}
            </div>
            <div className="mt-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              <span className="text-xs font-bold uppercase tracking-widest text-white">{video.philosopher2}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Audio visualizer effect when playing */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center gap-1 pb-4 opacity-50">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [10, Math.random() * 50 + 10, 10] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
              className={cn(
                "w-1.5 rounded-t-full",
                isP1Speaking ? "bg-orange-500" : isP2Speaking ? "bg-blue-500" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const VideoScreen = ({ currentVideo, history, setHistory }: { currentVideo: VideoMetadata | null, history: VideoMetadata[], setHistory: React.Dispatch<React.SetStateAction<VideoMetadata[]>> }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [bgVolume, setBgVolume] = useState(0.2);
  const [isMuted, setIsMuted] = useState(false);
  const [video, setVideo] = useState<VideoMetadata | null>(currentVideo);
  const [audioUrl, setAudioUrl] = useState<string | null>(currentVideo?.audio_url || null);
  const [audioLost, setAudioLost] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(0);
  
  const [activeTab, setActiveTab] = useState<'script' | 'social'>('script');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedAudioIdRef = useRef<string | null>(null);
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;
    const audio = audioRef.current;

    if (!(audio as any).audioCtx) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        (audio as any).audioCtx = audioCtx;
        (audio as any).analyser = analyser;
      } catch (e) {
        console.error("AudioContext error", e);
      }
    }

    const analyser = (audio as any).analyser;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrame: number;

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
      setAudioVolume(sum / dataArray.length);
      animationFrame = requestAnimationFrame(updateVolume);
    };

    if ((audio as any).audioCtx?.state === 'suspended') {
      (audio as any).audioCtx.resume();
    }
    updateVolume();

    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, audioUrl]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    handleMouseMove();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Load video and audio from history/IndexedDB if needed
  useEffect(() => {
    let currentAudioUrl: string | null = null;
    
    const loadVideo = async () => {
      if (!video && id) {
        const found = history.find(v => v.id === id);
        if (found) {
          setVideo(found);
          if (found.video_url) {
            if (found.video_url.startsWith('blob:')) {
              // Try to recover video blob
              const vBlob = await getVideoBlob(id);
              if (vBlob) {
                setVideoUrl(URL.createObjectURL(vBlob));
              } else {
                setVideoUrl(null); // Lost the blob
              }
            } else {
              setVideoUrl(found.video_url);
            }
          }
          // Try to recover audio blob from IndexedDB
          if (loadedAudioIdRef.current !== id) {
            loadedAudioIdRef.current = id || null;
            const blob = await getAudioBlob(id);
            if (blob) {
              currentAudioUrl = URL.createObjectURL(blob);
              setAudioUrl(currentAudioUrl);
              setAudioLost(false);
            } else if (audioUrl?.startsWith('blob:')) {
              setAudioUrl(null);
              setAudioLost(true);
            }
          }
        }
      } else if (video && video.id) {
        if (video.video_url && !videoUrl) {
          if (video.video_url.startsWith('blob:')) {
            const vBlob = await getVideoBlob(video.id);
            if (vBlob) {
              setVideoUrl(URL.createObjectURL(vBlob));
            } else {
              setVideoUrl(null);
            }
          } else {
            setVideoUrl(video.video_url);
          }
        }
        
        if ((!audioUrl || audioUrl.startsWith('blob:')) && loadedAudioIdRef.current !== video.id) {
          // Case where we have the video object but the blob URL is dead
          loadedAudioIdRef.current = video.id;
          const blob = await getAudioBlob(video.id);
          if (blob) {
            currentAudioUrl = URL.createObjectURL(blob);
            setAudioUrl(currentAudioUrl);
            setAudioLost(false);
          } else if (audioUrl?.startsWith('blob:')) {
            setAudioUrl(null);
            setAudioLost(true);
          }
        }
      }
    };
    loadVideo();

    return () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
      if (recordingAudioRef.current) {
        recordingAudioRef.current.pause();
        recordingAudioRef.current.src = "";
      }
    };
  }, [id, video, history]); // Removed audioUrl from dependencies

  useEffect(() => {
    if (isPlaying) {
      const audioPromise = audioRef.current?.play();
      if (audioPromise !== undefined) {
        audioPromise.catch(error => {
          if (error.name !== 'AbortError' && !error.message?.includes('interrupted')) console.error("Audio play error:", error);
        });
      }
      
      const videoPromise = videoRef.current?.play();
      if (videoPromise !== undefined) {
        videoPromise.catch(error => {
          if (error.name !== 'AbortError' && !error.message?.includes('interrupted')) console.error("Video play error:", error);
        });
      }
      
      const bgPromise = bgMusicRef.current?.play();
      if (bgPromise !== undefined) {
        bgPromise.catch(error => {
          if (error.name !== 'AbortError' && !error.message?.includes('interrupted')) console.error("BgMusic play error:", error);
        });
      }
    } else {
      audioRef.current?.pause();
      videoRef.current?.pause();
      bgMusicRef.current?.pause();
    }
  }, [isPlaying, audioUrl]); // Re-run when audioUrl is loaded

  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = isMuted ? 0 : bgVolume;
    }
  }, [bgVolume, isMuted]);

  // Sync video time with audio time
  useEffect(() => {
    if (videoRef.current && audioRef.current && Math.abs(videoRef.current.currentTime - audioRef.current.currentTime) > 0.5) {
      videoRef.current.currentTime = audioRef.current.currentTime;
    }
  }, [currentTime]);

  // Sync current line with audio time
  useEffect(() => {
    if (!video?.dialogue || duration === 0) return;
    
    // Calculate cumulative durations based on character counts
    const totalChars = video.dialogue.reduce((acc, line) => acc + line.text.length, 0);
    let cumulativeTime = 0;
    let foundIndex = 0;
    
    for (let i = 0; i < video.dialogue.length; i++) {
      const lineWeight = video.dialogue[i].text.length / totalChars;
      const lineDuration = lineWeight * duration;
      cumulativeTime += lineDuration;
      
      if (currentTime <= cumulativeTime) {
        foundIndex = i;
        break;
      }
      
      // If we're at the last line and haven't found it yet
      if (i === video.dialogue.length - 1) {
        foundIndex = i;
      }
    }
    
    if (foundIndex !== currentLineIndex) {
      setCurrentLineIndex(foundIndex);
    }
  }, [currentTime, duration, video?.dialogue, currentLineIndex]);

  // Auto-scroll script container
  useEffect(() => {
    if (scriptContainerRef.current) {
      const activeElement = scriptContainerRef.current.children[currentLineIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLineIndex]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  const handleGenerateHeygenVideo = async () => {
    if (!video || !video.dialogue) return;
    setIsVideoGenerating(true);
    toast.info(t('generating_ai_video') || "Connecting to Heygen AI...");
    
    try {
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dialogue: video.dialogue,
          philosopher1: video.philosopher1,
          philosopher2: video.philosopher2,
          philosopher1Voice: video.philosopher1Voice,
          philosopher2Voice: video.philosopher2Voice,
          language: video.language
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate video with Heygen");
      }
      
      const videoId = data.data.video_id;
      
      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/video/status/${videoId}`);
          const statusData = await statusRes.json();
          
          if (statusData.data.status === "completed") {
            clearInterval(pollInterval);
            const url = statusData.data.video_url;
            setVideoUrl(url);
            
            // Update history and local state
            setHistory(prev => prev.map(v => v.id === video.id ? { ...v, video_url: url } : v));
            setVideo(prev => prev ? { ...prev, video_url: url } : prev);
            
            // Update Firestore
            const docRef = doc(db, "dialogues", video.id);
            await updateDoc(docRef, { video_url: url });
            
            setIsVideoGenerating(false);
            toast.success(t('video_ready') || "AI Video generated successfully!");
          } else if (statusData.data.status === "failed") {
            clearInterval(pollInterval);
            setIsVideoGenerating(false);
            toast.error("Heygen video generation failed.");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000);
      
    } catch (error: any) {
      console.error("Heygen error:", error);
      toast.error(error.message || "Failed to generate AI video");
      setIsVideoGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    // If user wants Heygen, we could give a choice, but for now let's use local
    // as it's faster and doesn't cost credits.
    // If you want to use Heygen by default, call handleGenerateHeygenVideo() instead.
    
    if (!audioUrl || !video) return;
    setIsVideoGenerating(true);
    toast.info(t('generating_ai_video') || "Generating video locally...");
    
    try {
      // 1. Setup canvas
      const canvas = document.createElement('canvas');
      const isPortrait = video.videoFormat === 'portrait';
      canvas.width = isPortrait ? 720 : 1280;
      canvas.height = isPortrait ? 1280 : 720;
      const ctx = canvas.getContext('2d')!;
      
      // 2. Load audio
      const audio = new Audio(audioUrl);
      recordingAudioRef.current = audio;
      audio.crossOrigin = "anonymous";
      
      // 3. Setup MediaRecorder
      const stream = canvas.captureStream(30); // 30 fps
      
      // Add audio track & Analyser
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);
      analyser.connect(dest);
      source.connect(audioCtx.destination); // Play audio while recording
      
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }
      
      // Try to use mp4 if supported, else webm
      let mimeType = 'video/webm; codecs=vp8,opus';
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        
        await saveVideoBlob(video.id, blob);
        
        // Update history and local state
        setHistory(prev => prev.map(v => v.id === video.id ? { ...v, video_url: url } : v));
        setVideo(prev => prev ? { ...prev, video_url: url } : prev);
        
        // Update Firestore
        const docRef = doc(db, "dialogues", video.id);
        await updateDoc(docRef, { video_url: url });
        
        setIsVideoGenerating(false);
        toast.success(t('video_ready') || "Video generated successfully!");
      };
      
      // 4. Load images
      const img1 = new Image(); img1.crossOrigin = "anonymous"; img1.src = p1AvatarUrl;
      const img2 = new Image(); img2.crossOrigin = "anonymous"; img2.src = p2AvatarUrl;
      
      await Promise.all([
        new Promise(r => { img1.onload = r; img1.onerror = r; }),
        new Promise(r => { img2.onload = r; img2.onerror = r; })
      ]);
      
      // 5. Draw loop
      recorder.start();
      try {
        await audio.play();
      } catch (e) {
        console.error("Audio play interrupted during generation:", e);
        recorder.stop();
        setIsVideoGenerating(false);
        return;
      }
      
      const draw = () => {
        if (audio.ended || audio.paused) return;
        
        const currentTime = audio.currentTime;
        const duration = audio.duration || 1;
        const totalChars = video.dialogue?.reduce((acc, line) => acc + line.text.length, 0) || 1;
        let accumulatedTime = 0;
        let currentSpeaker = video.philosopher1;
        
        for (let i = 0; i < (video.dialogue?.length || 0); i++) {
          const line = video.dialogue![i];
          const lineDuration = (line.text.length / totalChars) * duration;
          if (currentTime >= accumulatedTime && currentTime < accumulatedTime + lineDuration) {
            currentSpeaker = line.speaker;
            break;
          }
          accumulatedTime += lineDuration;
        }
        
        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const isP1 = currentSpeaker === video.philosopher1;
        const isP2 = currentSpeaker === video.philosopher2;

        // Audio Analysis
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avgVolume = sum / bufferLength;
        const reactScale = 1 + (avgVolume / 255) * 0.15;
        const waveRadius = (avgVolume / 255) * 60;
        
        // Draw P1
        const p1X = isPortrait ? 360 : 320;
        const p1Y = 360;
        const p1BaseRadius = isP1 ? 220 : 180;
        const p1CurrentRadius = isP1 ? p1BaseRadius * reactScale : p1BaseRadius;

        // Draw Sound Waves for P1
        if (isP1 && avgVolume > 5) {
          ctx.beginPath();
          ctx.arc(p1X, p1Y, p1CurrentRadius + waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(249, 115, 22, ${avgVolume / 255})`;
          ctx.lineWidth = 10 + (avgVolume / 255) * 20;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p1X, p1Y, p1CurrentRadius + waveRadius * 0.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(249, 115, 22, ${(avgVolume / 255) * 0.5})`;
          ctx.lineWidth = 5;
          ctx.stroke();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p1X, p1Y, p1CurrentRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#18181b'; // zinc-900
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.font = `${150 * (isP1 ? reactScale : 1)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (video.p1Avatar?.background) {
          const bgIcon = AVATAR_BACKGROUNDS.find(b => b.id === video.p1Avatar?.background)?.icon || '';
          ctx.fillText(bgIcon, p1X, p1Y);
        }
        ctx.globalAlpha = 1.0;
        try { 
          const scaleRatio = p1CurrentRadius / 220;
          const imgSizeScaled = 440 * scaleRatio;
          ctx.drawImage(img1, p1X - imgSizeScaled/2, p1Y - imgSizeScaled/2, imgSizeScaled, imgSizeScaled);
        } catch (e) {}
        ctx.restore(); // Restore clip region
        
        if (video.p1Avatar?.clothes) {
          const clothesIcon = AVATAR_CLOTHES.find(c => c.id === video.p1Avatar?.clothes)?.icon || '';
          ctx.font = `${120 * (isP1 ? reactScale : 1)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(clothesIcon, p1X, p1Y + 200 * (isP1 ? reactScale : 1));
        }
        
        if (video.p1Avatar?.microphone) {
          const micIcon = AVATAR_MICROPHONES.find(m => m.id === video.p1Avatar?.microphone)?.icon || '';
          ctx.font = `${80 * (isP1 ? reactScale : 1)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(micIcon, p1X + 160 * (isP1 ? reactScale : 1), p1Y + 160 * (isP1 ? reactScale : 1));
        }
        
        if (isP1) {
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(p1X, p1Y, p1CurrentRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Draw P2
        const p2X = isPortrait ? 360 : 960;
        const p2Y = isPortrait ? 860 : 360;
        const p2BaseRadius = isP2 ? 220 : 180;
        const p2CurrentRadius = isP2 ? p2BaseRadius * reactScale : p2BaseRadius;

        // Draw Sound Waves for P2
        if (isP2 && avgVolume > 5) {
          ctx.beginPath();
          ctx.arc(p2X, p2Y, p2CurrentRadius + waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${avgVolume / 255})`;
          ctx.lineWidth = 10 + (avgVolume / 255) * 20;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p2X, p2Y, p2CurrentRadius + waveRadius * 0.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${(avgVolume / 255) * 0.5})`;
          ctx.lineWidth = 5;
          ctx.stroke();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p2X, p2Y, p2CurrentRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#18181b';
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.font = `${150 * (isP2 ? reactScale : 1)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (video.p2Avatar?.background) {
          const bgIcon = AVATAR_BACKGROUNDS.find(b => b.id === video.p2Avatar?.background)?.icon || '';
          ctx.fillText(bgIcon, p2X, p2Y);
        }
        ctx.globalAlpha = 1.0;
        try { 
          const scaleRatio = p2CurrentRadius / 220;
          const imgSizeScaled = 440 * scaleRatio;
          ctx.drawImage(img2, p2X - imgSizeScaled/2, p2Y - imgSizeScaled/2, imgSizeScaled, imgSizeScaled);
        } catch (e) {}
        ctx.restore(); // Restore clip region
        
        if (video.p2Avatar?.clothes) {
          const clothesIcon = AVATAR_CLOTHES.find(c => c.id === video.p2Avatar?.clothes)?.icon || '';
          ctx.font = `${120 * (isP2 ? reactScale : 1)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(clothesIcon, p2X, p2Y + 200 * (isP2 ? reactScale : 1));
        }
        
        if (video.p2Avatar?.microphone) {
          const micIcon = AVATAR_MICROPHONES.find(m => m.id === video.p2Avatar?.microphone)?.icon || '';
          ctx.font = `${80 * (isP2 ? reactScale : 1)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(micIcon, p2X + 160 * (isP2 ? reactScale : 1), p2Y + 160 * (isP2 ? reactScale : 1));
        }
        
        if (isP2) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(p2X, p2Y, p2CurrentRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Draw names
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(video.philosopher1.toUpperCase(), isPortrait ? 360 : 320, isPortrait ? 620 : 620);
        ctx.fillText(video.philosopher2.toUpperCase(), isPortrait ? 360 : 960, isPortrait ? 1120 : 620);
        
        requestAnimationFrame(draw);
      };
      
      draw();
      
      audio.onended = () => {
        recorder.stop();
        audioCtx.close();
      };
      
    } catch (error: any) {
      console.error("Error generating video:", error);
      setIsVideoGenerating(false);
      toast.error(t('failed_to_generate_video') || "Failed to generate video");
    }
  };

  const handleDownloadTranscript = () => {
    if (!video.dialogue) return;
    const text = video.dialogue.map(d => `${d.speaker}: ${d.text}`).join('\n\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `philosophy_talk_${video.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = async () => {
    const url = audioUrl || video.audio_url;
    if (!url) return;
    
    try {
      // If it's a blob URL, we can download it directly
      if (url.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `philosophy_podcast_${video.id}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // For remote URLs, fetch and create a blob to force download
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `philosophy_podcast_${video.id}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, '_blank');
    }
  };

  const handleDownloadVideo = async () => {
    if (!videoUrl) return;
    
    try {
      if (videoUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `philosophy_video_${video.id}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `philosophy_video_${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(videoUrl, '_blank');
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!video.id) return;
    setIsPublishing(true);
    try {
      const docRef = doc(db, "dialogues", video.id);
      await updateDoc(docRef, {
        isPublic: true
      });
      setVideo(prev => prev ? { ...prev, isPublic: true } : prev);
      toast.success(t('dialogue_published'));
    } catch (error) {
      console.error("Error publishing:", error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, `dialogues/${video.id}`);
      } catch (e) {
        // Logged context
      }
      toast.error(t('failed_to_publish'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleShare = async () => {
    const formattedTopic = video.topic.startsWith("Summary of ") 
      ? video.topic.replace("Summary of ", isRtl ? "تلخيص " : "Summary of ") 
      : video.topic;
      
    const shareData = {
      title: `${video.philosopher1} vs ${video.philosopher2}`,
      text: t('share_text', { topic: formattedTopic }),
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('link_copied'));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error("Error sharing:", err);
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('link_copied'));
      } catch (clipErr) {
        console.error("Clipboard fallback failed:", clipErr);
      }
    }
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center relative">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
        >
          {isRtl ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h2 className="text-2xl font-bold mb-4">{t('no_podcast_selected') || 'No Podcast Selected'}</h2>
        <button onClick={() => navigate("/")} className="text-orange-500">{t('go_home') || 'Go Home'}</button>
      </div>
    );
  }

  const currentLine = video.dialogue?.[currentLineIndex];
  const p1Data = PHILOSOPHERS.find(p => p.name === video.philosopher1);
  const p2Data = PHILOSOPHERS.find(p => p.name === video.philosopher2);
  const p1AvatarUrl = p1Data?.avatar || `https://picsum.photos/seed/${video.philosopher1}/200/200`;
  const p2AvatarUrl = p2Data?.avatar || `https://picsum.photos/seed/${video.philosopher2}/200/200`;

  const getThemeBackground = () => {
    const era = p1Data?.era || 'modern';
    switch (era) {
      case 'ancient': return "bg-gradient-to-br from-amber-900/40 via-black to-orange-900/40";
      case 'medieval': return "bg-gradient-to-br from-blue-900/40 via-black to-indigo-900/40";
      case 'modern': return "bg-gradient-to-br from-zinc-900/40 via-black to-slate-900/40";
      case 'contemporary': return "bg-gradient-to-br from-emerald-900/40 via-black to-teal-900/40";
      default: return "bg-[#0a0a0a]";
    }
  };

  return (
    <div 
      className={cn("h-screen w-full flex flex-col font-sans transition-colors duration-1000 bg-black text-white")}
      dir={isRtl ? "rtl" : "ltr"}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Top Header - Auto Hiding */}
      <AnimatePresence>
        {showControls && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/90 via-black/50 to-transparent"
          >
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all">
              {isRtl ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
            </button>
            <div className="text-center max-w-[60%]">
              <h1 className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-orange-500 mb-1 truncate">
                {video.generationMode === "solo" ? (t('solo_voiceover') || "Solo Voiceover") : t('philosophical_debate')}
              </h1>
              <p className="text-[10px] md:text-xs text-white/60 truncate">
                {video.topic.startsWith("Summary of ") 
                  ? video.topic.replace("Summary of ", isRtl ? "تلخيص " : "Summary of ") 
                  : video.topic}
              </p>
            </div>
            <div className="w-10 h-10"></div> {/* Spacer to keep title centered */}
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Video Area */}
      <div 
        ref={playerContainerRef}
        className="relative flex-1 w-full bg-black overflow-hidden flex flex-col"
        onDoubleClick={toggleFullscreen}
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      >
        {audioLost && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/80 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-2 shadow-lg">
            <AlertTriangle size={14} />
            {t('audio_lost_warning') || 'Audio not found on this device. Please generate a new video.'}
          </div>
        )}
        
        {/* Video or Simulator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {videoUrl ? (
            <video 
              ref={videoRef}
              src={videoUrl} 
              className="w-full h-full object-contain" 
              autoPlay 
              loop 
              muted={!isPlaying}
              playsInline
              onError={() => console.error("Video failed to load: " + videoUrl)}
              onClick={() => setIsPlaying(!isPlaying)}
            />
          ) : isVideoGenerating ? (
            <div className="flex flex-col items-center gap-6 z-10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full"
              />
              <div className="text-center bg-black/60 p-6 rounded-2xl backdrop-blur-md border border-white/10">
                <h3 className="text-xl font-bold mb-2">{t('generating_ai_video')}</h3>
                <p className="text-white/60 text-sm">{t('heygen_connecting', { p1: video.philosopher1, p2: video.philosopher2 })}</p>
              </div>
            </div>
          ) : (
            <PodcastSimulator 
              video={video} 
              currentLine={currentLine} 
              isPlaying={isPlaying} 
              p1AvatarUrl={p1AvatarUrl} 
              p2AvatarUrl={p2AvatarUrl} 
              p1Avatar={video.p1Avatar}
              p2Avatar={video.p2Avatar}
              audioVolume={audioVolume}
            />
          )}
        </div>

        {/* Subtitles Overlay */}
        {currentLine && !currentLine.speaker?.toUpperCase().includes('SETTING') && (
          <div className="absolute bottom-24 left-0 right-0 z-30 px-4 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentLineIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto text-center"
              >
                <div className="inline-block bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-2xl max-w-full">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 mb-1">
                    {currentLine.speaker}
                  </div>
                  <p className={cn("text-sm md:text-lg font-serif italic leading-relaxed text-white drop-shadow-lg line-clamp-4", isRtl && "text-right")}>
                    "{currentLine.text}"
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Controls Overlay - Auto Hiding */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20 pb-6 px-4 md:px-8 z-40"
            >
              <div className="max-w-4xl mx-auto flex flex-col gap-4">
                {/* Progress Bar */}
                <div className="flex flex-col gap-2">
                  <div className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden group cursor-pointer">
                    <input 
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleScrub}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-100"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-white/60 uppercase tracking-widest">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={handleSkipBack} className="text-white/60 hover:text-white transition-colors">
                      <SkipBack size={20} />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-xl"
                    >
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={handleSkipForward} className="text-white/60 hover:text-white transition-colors">
                      <SkipForward size={20} />
                    </button>
                    
                    <div className="hidden md:flex items-center gap-2 ml-4 bg-white/10 px-3 py-1.5 rounded-full">
                      <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white">
                        {isMuted || bgVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={bgVolume}
                        onChange={(e) => {
                          setBgVolume(parseFloat(e.target.value));
                          setIsMuted(false);
                        }}
                        className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <LikeButton dialogueId={video.id || ""} likesCount={video.likes || 0} />
                    
                    <button 
                      onClick={handleGenerateHeygenVideo}
                      disabled={isVideoGenerating || !!videoUrl}
                      className="hidden md:flex bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full text-xs font-bold transition-all items-center gap-2 disabled:opacity-50"
                      title={videoUrl ? t('video_ready') : t('ai_video_heygen')}
                    >
                      <VideoIcon size={14} /> <span>{videoUrl ? t('video_ready') : t('ai_video_heygen')}</span>
                    </button>

                    <button 
                      onClick={toggleFullscreen}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                      title="Fullscreen"
                    >
                      <Maximize size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable Script Area */}
      <div className="h-1/3 min-h-[250px] bg-[#0a0a0a] border-t border-white/10 flex flex-col relative z-20">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('script')}
              className={cn(
                "text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                activeTab === 'script' ? "text-orange-500" : "text-white/40 hover:text-white/60"
              )}
            >
              <MessageSquare size={14} /> {t('script')}
            </button>
            <button 
              onClick={() => setActiveTab('social')}
              className={cn(
                "text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                activeTab === 'social' ? "text-orange-500" : "text-white/40 hover:text-white/60"
              )}
            >
              <Share2 size={14} /> {isRtl ? "وسائل التواصل" : "Social Media"}
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadAudio}
              className="px-4 py-2 flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20"
              title={t('audio')}
            >
              <Download size={14} /> {t('download_audio') || "Download Audio"}
            </button>
            <button 
              onClick={handleDownloadTranscript}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
              title={t('download_transcript')}
            >
              <FileText size={16} />
            </button>
          </div>
        </div>
        
        <div 
          ref={scriptContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth"
        >
          {activeTab === 'script' ? (
            video.dialogue?.map((line, index) => (
              <div 
                key={index}
                className={cn(
                  "p-4 rounded-2xl transition-all duration-300",
                  index === currentLineIndex 
                    ? "bg-white/10 border border-white/20 shadow-lg" 
                    : "opacity-40 hover:opacity-70"
                )}
                onClick={() => {
                  if (audioRef.current) {
                    const newTime = (index / (video.dialogue?.length || 1)) * (duration || 0);
                    audioRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                    setCurrentLineIndex(index);
                  }
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    line.speaker === video.philosopher1 ? "bg-orange-500" : "bg-blue-500"
                  )} />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                    {line.speaker}
                  </span>
                </div>
                <p className={cn(
                  "text-sm md:text-base leading-relaxed",
                  index === currentLineIndex ? "text-white" : "text-white/60"
                )}>
                  {line.text}
                </p>
              </div>
            ))
          ) : (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500">
                    {isRtl ? "عنوان مقترح" : "Suggested Title"}
                  </h4>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(video.socialTitle || "");
                      toast.success(t('common_copied') || "Copied!");
                    }}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-lg font-bold text-white leading-tight">
                  {video.socialTitle || (isRtl ? "لا يوجد عنوان" : "No title available")}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500">
                    {isRtl ? "وصف مقترح" : "Suggested Description"}
                  </h4>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(video.socialDescription || "");
                      toast.success(t('common_copied') || "Copied!");
                    }}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  {video.socialDescription || (isRtl ? "لا يوجد وصف" : "No description available")}
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const text = `${video.socialTitle}\n\n${video.socialDescription}`;
                    if (navigator.share) {
                      navigator.share({
                        title: video.socialTitle,
                        text: text,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(text);
                      toast.success(t('common_copied') || "Copied!");
                    }
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Share2 size={18} /> {isRtl ? "مشاركة" : "Share Now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Audio Elements */}
      {audioUrl && (
        <audio 
          ref={audioRef}
          src={audioUrl} 
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setIsPlaying(false)}
          onError={() => console.error("Audio failed to load: " + audioUrl)}
        />
      )}
      {video.include_music !== false && (
        <audio 
          ref={bgMusicRef}
          src="/api/ambient-music"
          loop
          onError={(e) => {
            console.error("Background music failed to load");
            // Silently fail or show a non-intrusive warning
          }}
        />
      )}
    </div>
  );
};

const LikeButton = ({ dialogueId, likesCount, className }: { dialogueId: string; likesCount: number; className?: string }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLiked, setIsLiked] = useState(false);
  const [count, setCount] = useState(likesCount);

  useEffect(() => {
    if (!user) return;
    const likeId = `${user.uid}_${dialogueId}`;
    const unsubscribe = onSnapshot(doc(db, "likes", likeId), (doc) => {
      setIsLiked(doc.exists());
    }, (error) => {
      console.error("Likes listener error:", error);
      try {
        handleFirestoreError(error, OperationType.GET, `likes/${likeId}`);
      } catch (e) {
        // Logged context
      }
    });
    return unsubscribe;
  }, [user, dialogueId]);

  useEffect(() => {
    setCount(likesCount);
  }, [likesCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error(t('login_to_like'));
      return;
    }

    const likeId = `${user.uid}_${dialogueId}`;
    const likeRef = doc(db, "likes", likeId);
    const dialogueRef = doc(db, "dialogues", dialogueId);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(dialogueRef, { likes: increment(-1) });
        setCount(prev => prev - 1);
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          dialogueId,
          createdAt: new Date().toISOString()
        });
        await updateDoc(dialogueRef, { likes: increment(1) });
        setCount(prev => prev + 1);
        toast.success(t('added_to_liked'));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
      } catch (e) {
        // Logged context
      }
      toast.error("Failed to update like");
    }
  };

  return (
    <button 
      onClick={handleLike}
      className={cn("flex items-center gap-1 transition-all hover:scale-110", className)}
    >
      <Heart size={18} className={cn(isLiked ? "text-red-500 fill-red-500" : "text-white/60")} />
      <span className="text-xs font-medium">{count || 0}</span>
    </button>
  );
};

const CommunityScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [feed, setFeed] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dialogues" | "books">("dialogues");

  useEffect(() => {
    const q = query(
      collection(db, "dialogues"),
      where("isPublic", "==", true),
      orderBy("created_at", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoMetadata));
      setFeed(docs);
      setLoading(false);
    }, (error) => {
      console.error("Community feed error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'dialogues');
      } catch (e) {
        // Logged context
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-500" size={48} />
    </div>
  );

  const filteredFeed = feed.filter(item => {
    const isBookSummary = item.topic.startsWith("Summary of ");
    if (activeTab === "books") return isBookSummary;
    return !isBookSummary;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6" dir={isRtl ? "rtl" : "ltr"}>
      <Header title={t('header_community')} />
      
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab("dialogues")}
          className={cn(
            "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
            activeTab === "dialogues" ? "bg-orange-500 text-white shadow-lg" : "text-white/60 hover:text-white"
          )}
        >
          {t('community_tab_dialogues')}
        </button>
        <button
          onClick={() => setActiveTab("books")}
          className={cn(
            "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
            activeTab === "books" ? "bg-orange-500 text-white shadow-lg" : "text-white/60 hover:text-white"
          )}
        >
          {t('community_tab_books')}
        </button>
      </div>

      <div className="space-y-6">
        {filteredFeed.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden"
          >
            <div className="aspect-video bg-white/10 relative flex items-center justify-center group cursor-pointer" onClick={() => navigate(`/video/${item.id}`)}>
              <img 
                src={`https://picsum.photos/seed/${item.id}/600/400`} 
                alt="Thumbnail" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/40 group-hover:scale-110 transition-transform">
                  <Play size={32} fill="white" className={cn(isRtl && "rotate-180")} />
                </div>
              </div>
              <div className={cn("absolute bottom-4 left-4 right-4 flex justify-between items-center", isRtl && "flex-row-reverse")}>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-orange-500 overflow-hidden">
                    <img src={item.authorPhoto || `https://api.dicebear.com/7.x/notionists/svg?seed=${item.authorName}`} alt="Avatar" />
                  </div>
                  <span className="text-xs font-medium">@{item.authorName}</span>
                </div>
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <LikeButton dialogueId={item.id} likesCount={item.likes || 0} />
                  <div className="flex items-center gap-1 text-xs">
                    <MessageSquareIcon size={14} />
                    <span>{Math.floor((item.likes || 0) / 4)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={cn("p-6", isRtl ? "text-right" : "text-left")}>
              <h3 className="text-xl font-bold mb-1">{item.philosopher1} vs {item.philosopher2}</h3>
              <p className="text-white/60 text-sm mb-4">
                {item.topic.startsWith("Summary of ") 
                  ? item.topic.replace("Summary of ", isRtl ? "تلخيص " : "Summary of ")
                  : t('exploring_depths', { topic: item.topic })
                }
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/video/${item.id}`)}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-2xl text-sm font-bold transition-colors"
                >
                  {t('view_dialogue')}
                </button>
                <button className="w-12 h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center rounded-2xl transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredFeed.length === 0 && (
          <div className="p-20 text-center">
            <Sparkles size={64} className="mx-auto text-white/10 mb-6" />
            <p className="text-white/40">{activeTab === "books" ? t('no_public_books') : t('no_public_dialogues')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileScreen = ({ history }: { history: VideoMetadata[] }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, isRtl, language: uiLanguage, setLanguage } = useLanguage();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  
  const totalLikes = history.reduce((acc, v) => acc + (v.likes || 0), 0);
  const currentLang = LANGUAGES.find(l => l.id === uiLanguage);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6" dir={isRtl ? "rtl" : "ltr"}>
      <Header title={t('header_profile')} />
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-full bg-orange-500 p-1 mb-4">
          <img src={user?.photoURL || "https://picsum.photos/seed/user/200/200"} alt="User" className="w-full h-full rounded-full object-cover" />
        </div>
        <h2 className="text-2xl font-bold">{user?.displayName || t('user_name')}</h2>
        <p className="text-white/60">{user?.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center flex flex-col justify-center items-center">
          <div className="text-xl font-bold">{history.length}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{t('videos')}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center flex flex-col justify-center items-center">
          <div className="text-xl font-bold">{totalLikes}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{t('likes')}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center flex flex-col justify-center items-center">
          <div className="text-xl font-bold">128</div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{t('subscribers')}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center flex flex-col justify-center items-center">
          <div className="text-xl font-bold text-orange-500 uppercase">
            {user?.plan === 'Pro' ? t('sub_pro') : user?.plan === 'Enterprise' ? t('sub_enterprise') : t('sub_free')}
          </div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{t('plan')}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="px-5 py-3">
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">{t('language')}</p>
          <button
            onClick={() => setIsLanguageModalOpen(true)}
            className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Globe size={20} className="text-orange-500" />
              <span className="font-medium">{currentLang?.flag} {currentLang?.name}</span>
            </div>
            {isRtl ? <ChevronLeft size={16} className="opacity-40" /> : <ChevronRight size={16} className="opacity-40" />}
          </button>
        </div>

        {[
          { icon: Play, label: t('my_videos'), action: () => navigate("/history") },
          { icon: Heart, label: t('liked_dialogues'), action: () => navigate("/liked") },
          { icon: CreditCard, label: t('subscription'), action: () => navigate("/subscription") },
          { icon: HelpCircle, label: t('help_support'), action: () => navigate("/help") },
          { icon: LogOut, label: t('logout'), action: signOut, destructive: true },
        ].map((item, i) => (
          <button 
            key={i}
            onClick={item.action}
            className={cn(
              "w-full p-5 flex items-center justify-between rounded-2xl transition-colors",
              item.destructive ? "text-red-500 hover:bg-red-500/5" : "text-white/80 hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-4">
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
            {isRtl ? <ChevronLeft size={16} className="opacity-40" /> : <ChevronRight size={16} className="opacity-40" />}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isLanguageModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLanguageModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#141414] border-t border-white/10 rounded-t-3xl z-[60] p-5 pb-8"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-4 text-center">{t('language')}</h3>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setLanguage(lang.id as Language);
                      setIsLanguageModalOpen(false);
                    }}
                    className={cn(
                      "w-full p-3 rounded-2xl border transition-all flex items-center justify-between",
                      uiLanguage === lang.id 
                        ? "bg-orange-500/10 border-orange-500/50 text-orange-500" 
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium text-base">{lang.name}</span>
                    </div>
                    {uiLanguage === lang.id && <Check size={18} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const LikedDialoguesScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [likedDialogues, setLikedDialogues] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // 1. Get user likes
    const q = query(collection(db, "likes"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const dialogueIds = snapshot.docs.map(doc => doc.data().dialogueId);
      
      if (dialogueIds.length === 0) {
        setLikedDialogues([]);
        setLoading(false);
        return;
      }

      // 2. Fetch the actual dialogues
      const dialogues: VideoMetadata[] = [];
      for (const id of dialogueIds) {
        try {
          const d = await getDoc(doc(db, "dialogues", id));
          if (d.exists()) {
            dialogues.push({ id: d.id, ...d.data() } as VideoMetadata);
          }
        } catch (err) {
          console.error("Failed to fetch liked dialogue:", err);
        }
      }
      setLikedDialogues(dialogues);
      setLoading(false);
    }, (error) => {
      console.error("Liked dialogues listener error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'likes');
      } catch (e) {
        // Logged context
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6" dir={isRtl ? "rtl" : "ltr"}>
      <Header title={t('header_liked')} showBack />
      <div className="space-y-4">
        {likedDialogues.map(v => (
          <button 
            key={v.id}
            onClick={() => navigate(`/video/${v.id}`)}
            className={cn(
              "w-full p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all",
              isRtl ? "text-right" : "text-left"
            )}
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-red-500">
              <Heart size={28} fill="currentColor" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg">{v.philosopher1} vs {v.philosopher2}</h4>
              <p className="text-sm text-white/60 mb-2">
                {v.topic.startsWith("Summary of ") 
                  ? v.topic.replace("Summary of ", isRtl ? "تلخيص " : "Summary of ") 
                  : v.topic}
              </p>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">{t('liked_by_you')}</div>
            </div>
          </button>
        ))}
        {likedDialogues.length === 0 && (
          <div className="p-20 text-center">
            <Heart size={64} className="mx-auto text-white/10 mb-6" />
            <p className="text-white/40">{t('no_liked_dialogues')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SubscriptionScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("success")) {
      const plan = query.get("plan");
      if (plan) {
        toast.success(t('upgrade_success', { plan }));
      }
      // Remove query params
      navigate("/subscription", { replace: true });
    }
    if (query.get("canceled")) {
      toast.error("Payment canceled.");
      navigate("/subscription", { replace: true });
    }
  }, [location.search, navigate, t]);

  const plans = [
    { name: t('sub_free'), price: "$0", features: [t('feature_3_dialogues'), t('feature_standard_quality'), t('feature_community_access')] },
    { name: t('sub_pro'), price: "$9.99", features: [t('feature_unlimited_dialogues'), t('feature_4k_quality'), t('feature_custom_voices'), t('feature_no_watermark')] },
    { name: t('sub_enterprise'), price: "$49.99", features: [t('feature_api_access'), t('feature_commercial_rights'), t('feature_priority_support')] },
  ];

  const handleUpgrade = async (planName: string, price: string) => {
    if (!user) return;
    if (user.plan === planName) {
      toast.info(t('already_on_plan', { plan: planName }));
      return;
    }

    if (price === "$0") {
      try {
        await updateDoc(doc(db, "users", user.uid), { plan: planName });
        toast.success(t('upgrade_success', { plan: planName }));
      } catch (error) {
        console.error("Upgrade error:", error);
        toast.error(t('upgrade_failed'));
      }
      return;
    }

    setIsLoading(planName);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName, price, userId: user.uid }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Stripe error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6" dir={isRtl ? "rtl" : "ltr"}>
      <Header title={t('header_subscription')} showBack />
      <div className="space-y-6">
        {plans.map((plan, i) => (
          <div 
            key={i}
            className={cn(
              "p-8 rounded-[32px] border transition-all",
              user?.plan === plan.name ? "bg-orange-500 border-orange-400 shadow-xl shadow-orange-500/20" : "bg-white/5 border-white/10"
            )}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="text-3xl font-black mt-2">{plan.price}<span className="text-sm font-normal opacity-60">/{t('mo')}</span></div>
              </div>
              {user?.plan === plan.name && (
                <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{t('current_plan')}</div>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Plus size={12} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleUpgrade(plan.name, plan.price)}
              disabled={isLoading === plan.name}
              className={cn(
                "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                user?.plan === plan.name ? "bg-white text-orange-500" : "bg-white/10 hover:bg-white/20 text-white",
                isLoading === plan.name && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading === plan.name ? <Loader2 size={20} className="animate-spin" /> : null}
              {user?.plan === plan.name ? t('manage_plan') : t('upgrade_now')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const HelpSupportScreen = () => {
  const { t, isRtl } = useLanguage();
  const faqs = [
    { q: t('help_faq_1_q'), a: t('help_faq_1_a') },
    { q: t('help_faq_2_q'), a: t('help_faq_2_a') },
    { q: t('help_faq_3_q'), a: t('help_faq_3_a') },
    { q: t('help_faq_4_q'), a: t('help_faq_4_a') },
    { q: t('help_faq_5_q'), a: t('help_faq_5_a') },
    { q: t('help_faq_6_q'), a: t('help_faq_6_a') },
  ];

  const handleContactSupport = () => {
    toast.success(t('support_request_sent'));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6" dir={isRtl ? "rtl" : "ltr"}>
      <Header title={t('header_help')} showBack />
      <div className="space-y-8">
        <div className="bg-white/5 border border-white/10 p-8 rounded-[32px]">
          <h3 className="text-xl font-bold mb-6">{t('faqs')}</h3>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-2">
                <h4 className="font-bold text-orange-500">{faq.q}</h4>
                <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-orange-500 p-8 rounded-[32px] text-center">
          <MessageSquare size={48} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{t('still_need_help')}</h3>
          <p className="text-white/80 text-sm mb-6">{t('support_team_available')}</p>
          <button 
            onClick={handleContactSupport}
            className="w-full bg-white text-orange-500 py-4 rounded-2xl font-bold"
          >
            {t('contact_support')}
          </button>
        </div>
      </div>
    </div>
  );
};

const HistoryScreen = ({ history, setCurrentVideo }: { history: VideoMetadata[], setCurrentVideo: (v: VideoMetadata) => void }) => {
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await deleteDoc(doc(db, "dialogues", id));
      toast.success(t('delete_success'));
    } catch (error) {
      console.error("Error deleting:", error);
      try {
        handleFirestoreError(error, OperationType.DELETE, `dialogues/${id}`);
      } catch (e) {
        // Logged context
      }
      toast.error(t('delete_failed'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6" dir={isRtl ? "rtl" : "ltr"}>
      <Header title={t('header_history')} />
      <div className="space-y-4">
        {history.map(v => (
          <div key={v.id} className="relative group">
            <button 
              onClick={() => { setCurrentVideo(v); navigate(`/video/${v.id}`); }}
              className={cn(
                "w-full p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all",
                isRtl ? "text-right" : "text-left"
              )}
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-orange-500">
                <Play size={28} fill="currentColor" className={cn(isRtl && "rotate-180")} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg">{v.philosopher1} vs {v.philosopher2}</h4>
                <p className="text-sm text-white/60 mb-2">
                  {v.topic.startsWith("Summary of ") 
                    ? v.topic.replace("Summary of ", isRtl ? "تلخيص " : "Summary of ") 
                    : v.topic}
                </p>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">{new Date(v.created_at).toLocaleDateString()}</div>
              </div>
            </button>
            <button 
              onClick={(e) => handleDelete(v.id, e)}
              className={cn(
                "absolute top-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20",
                isRtl ? "left-4" : "right-4"
              )}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {history.length === 0 && (
          <div className="p-20 text-center">
            <History size={64} className="mx-auto text-white/10 mb-6" />
            <p className="text-white/40">{t('no_history')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NavbarWrapper = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/video/")) return null;
  return <Navbar />;
};

const LoginScreen = () => {
  const { signIn } = useAuth();
  const { t, isRtl } = useLanguage();
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center" dir={isRtl ? "rtl" : "ltr"}>
      <div className="relative w-24 h-24 flex items-center justify-center mb-8">
        <div className="relative w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-orange-500/40">
          <Brain size={48} className="text-white" />
          {/* Speech bubble tail */}
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-orange-600 rotate-45 rounded-md -z-10" />
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-4 tracking-tight">PhiloTalk</h1>
      <p className="text-white/60 mb-12 max-w-xs">{t('login_description')}</p>
      <button 
        onClick={signIn}
        className="w-full bg-white text-black py-4 rounded-3xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-transform"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
        {t('continue_with_google')}
      </button>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-500" size={48} />
    </div>
  );
  if (!user) return <LoginScreen />;
  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<VideoMetadata[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoMetadata | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "dialogues"),
      where("userId", "==", user.uid),
      orderBy("created_at", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoMetadata));
      setHistory(docs);
    }, (error) => {
      // If index is missing, it will log an error with a link to create it
      console.error("Firestore error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'dialogues');
      } catch (e) {
        // Logged context
      }
    });
    return unsubscribe;
  }, [user]);

  return (
    <GenerationProvider setCurrentVideo={setCurrentVideo}>
      <Routes>
        <Route path="/" element={<HomeScreen history={history} setCurrentVideo={setCurrentVideo} />} />
        <Route path="/community" element={<CommunityScreen />} />
        <Route path="/generate" element={<GenerateScreen />} />
        <Route path="/video/:id" element={<VideoScreen currentVideo={currentVideo} history={history} setHistory={setHistory} />} />
        <Route path="/profile" element={<ProfileScreen history={history} />} />
        <Route path="/history" element={<HistoryScreen history={history} setCurrentVideo={setCurrentVideo} />} />
        <Route path="/liked" element={<LikedDialoguesScreen />} />
        <Route path="/subscription" element={<SubscriptionScreen />} />
        <Route path="/help" element={<HelpSupportScreen />} />
        <Route path="/settings" element={<ProfileScreen history={history} />} />
      </Routes>
      <NavbarWrapper />
    </GenerationProvider>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto bg-black min-h-screen relative shadow-2xl overflow-hidden">
            <Toaster position="top-center" richColors />
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
