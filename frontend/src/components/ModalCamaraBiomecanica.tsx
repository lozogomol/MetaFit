import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useCameraPermissions } from 'expo-camera';
import Svg, { Circle } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { Ejercicio } from '../models/Ejercicio';
import { ExerciseEngine, AnalysisResult } from '../services/exerciseEngine';
import { ColoresApp } from '../theme/colors';

// Geometría para micro-gráfica circular (estilo Análisis Biométrico)
const GAUGE_SIZE = 46;
const GAUGE_STROKE = 4.5;
const GAUGE_RADIUS = 18;
const GAUGE_CENTER = GAUGE_SIZE / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

interface Props {
  visible: boolean;
  ejercicio: Ejercicio | null;
  onCerrar: () => void;
  onCompletarSerie?: (reps: number) => void;
}

// HTML optimizado con Google MediaPipe Pose en tiempo real
const MEDIAPIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }
    #canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
      pointer-events: none;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>
</head>
<body>
  <video id="video" playsinline autoplay muted webkit-playsinline></video>
  <canvas id="canvas"></canvas>

  <script>
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let currentFacing = 'user';
    let poseInstance = null;
    let cameraStream = null;
    let isProcessing = false;

    function sendToApp(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {};
    }
    if (!navigator.mediaDevices.getUserMedia) {
      const legacyGetUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.getUserMedia;
      if (legacyGetUserMedia) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
          return new Promise(function(resolve, reject) {
            legacyGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      }
    }

    async function initMediaPipe() {
      try {
        poseInstance = new Pose({
          locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/' + file
        });

        poseInstance.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        poseInstance.onResults(onPoseResults);
        await startCamera('user');
      } catch (err) {
        sendToApp({ type: 'CAMERA_ERROR', error: err.message });
      }
    }

    function onPoseResults(results) {
      canvas.width = video.videoWidth || window.innerWidth;
      canvas.height = video.videoHeight || window.innerHeight;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        // Esqueleto limpio en rojo Meta Fit (#FF2D55) y blanco
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#FF2D55', lineWidth: 2 });
        drawLandmarks(ctx, results.poseLandmarks, { color: '#FFFFFF', fillColor: '#FF2D55', lineWidth: 1.5, radius: 3 });

        sendToApp({
          type: 'LANDMARKS',
          landmarks: results.poseLandmarks
        });
      } else {
        sendToApp({ type: 'NO_HUMAN' });
      }
      ctx.restore();
    }

    async function startCamera(facingMode) {
      try {
        currentFacing = facingMode;
        const isFront = facingMode === 'user';
        video.style.transform = isFront ? 'scaleX(-1)' : 'scaleX(1)';
        canvas.style.transform = isFront ? 'scaleX(-1)' : 'scaleX(1)';

        if (cameraStream) {
          cameraStream.getTracks().forEach(t => t.stop());
        }

        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: currentFacing,
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        video.srcObject = cameraStream;
        await video.play();

        sendToApp({ type: 'CAMERA_READY' });

        async function frameLoop() {
          if (video.readyState >= 2 && !isProcessing && poseInstance) {
            isProcessing = true;
            try {
              await poseInstance.send({ image: video });
            } catch (e) {}
            isProcessing = false;
          }
          requestAnimationFrame(frameLoop);
        }
        requestAnimationFrame(frameLoop);

      } catch (err) {
        sendToApp({ type: 'CAMERA_ERROR', error: err.message });
      }
    }

    window.toggleCameraFacing = function() {
      const nextFacing = currentFacing === 'user' ? 'environment' : 'user';
      startCamera(nextFacing);
      return nextFacing;
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMediaPipe);
    } else {
      initMediaPipe();
    }
  </script>
</body>
</html>
`;

export const ModalCamaraBiomecanica: React.FC<Props> = ({
  visible,
  ejercicio,
  onCerrar,
  onCompletarSerie,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState('Ponte de pie frente a la cámara');
  const [isFormCorrect, setIsFormCorrect] = useState(true);
  const [fase, setFase] = useState('invalid');
  const [primaryAngle, setPrimaryAngle] = useState(0);
  const [humanoDetectado, setHumanoDetectado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  const engineRef = useRef<ExerciseEngine | null>(null);
  const webViewRef = useRef<any>(null);

  // Control de audio mediante expo-speech (estilo Análisis Biométrico)
  const ultimoAudioRef = useRef<number>(0);
  const ultimaRepHabladaRef = useRef<number>(0);
  const ultimoErrorHabladoRef = useRef<string>('');

  const hablar = (texto: string, forzar: boolean = false) => {
    const ahora = Date.now();
    // Cooldown para no saturar el hilo de JavaScript ni la voz
    if (!forzar && ahora - ultimoAudioRef.current < 3500) {
      return;
    }
    try {
      Speech.stop();
      Speech.speak(texto, {
        language: 'es-US',
        rate: 1.0,
        pitch: 1.0,
      });
      ultimoAudioRef.current = ahora;
    } catch (e) {}
  };

  // Detener voz al desmontar o cerrar
  useEffect(() => {
    return () => {
      try {
        Speech.stop();
      } catch (e) {}
    };
  }, []);

  // Reiniciar estado cuando se abre un ejercicio
  useEffect(() => {
    if (visible && ejercicio) {
      engineRef.current = new ExerciseEngine(ejercicio.engineType);
      setReps(0);
      setFeedback('Ponte de pie frente a la cámara');
      setIsFormCorrect(true);
      setFase('invalid');
      setPrimaryAngle(0);
      setHumanoDetectado(false);
      setCargando(true);
      setErrorCamara(null);
      ultimoAudioRef.current = 0;
      ultimaRepHabladaRef.current = 0;
      ultimoErrorHabladoRef.current = '';
    } else {
      try {
        Speech.stop();
      } catch (e) {}
    }
  }, [visible, ejercicio]);

  if (!visible || !ejercicio) return null;

  // Recepción de datos REALES desde Google MediaPipe
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'LANDMARKS' && Array.isArray(data.landmarks) && data.landmarks.length > 0) {
        setCargando(false);
        setErrorCamara(null);
        setHumanoDetectado(true);

        if (engineRef.current) {
          const result: AnalysisResult = engineRef.current.processLandmarks(data.landmarks);

          if (result.trackingValid) {
            setReps(result.reps);
            setFeedback(result.feedback);
            setIsFormCorrect(result.isFormCorrect);
            setFase(result.phase);
            setPrimaryAngle(result.primaryAngle);

            // AUDIO: Si la repetición está bien o terminada
            if (result.repCompleted && result.reps > ultimaRepHabladaRef.current) {
              ultimaRepHabladaRef.current = result.reps;
              if (result.isFormCorrect) {
                // Dice la repetición completada con felicitación
                hablar(`${result.reps}`, true);
              } else {
                const err = result.errors[0] || 'Cuida la postura';
                hablar(`${result.reps}. ${err}`, true);
              }
            } else if (!result.repCompleted) {
              // AUDIO: Si hay errores durante la ejecución
              if (result.errors.length > 0) {
                const primerError = result.errors[0];
                if (primerError !== ultimoErrorHabladoRef.current || Date.now() - ultimoAudioRef.current > 4000) {
                  ultimoErrorHabladoRef.current = primerError;
                  hablar(primerError, false);
                }
              } else {
                ultimoErrorHabladoRef.current = '';
              }
            }
          } else {
            setHumanoDetectado(false);
            setFeedback('Aléjate un poco para ver tus articulaciones');
            setFase('invalid');
          }
        }
      } else if (data.type === 'NO_HUMAN') {
        setHumanoDetectado(false);
        setFeedback('No se detecta cuerpo. Colócate frente a la cámara.');
        setFase('invalid');
      } else if (data.type === 'CAMERA_READY') {
        setCargando(false);
      } else if (data.type === 'CAMERA_ERROR') {
        setCargando(false);
        setErrorCamara(data.error || 'No se pudo acceder a la cámara.');
      }
    } catch (err) {
      console.error('Error parseando mensaje:', err);
    }
  };

  const handleToggleCamara = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('window.toggleCameraFacing && window.toggleCameraFacing(); true;');
    }
  };

  const handleReiniciar = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setReps(0);
      setFeedback('Ponte de pie frente a la cámara');
      setIsFormCorrect(true);
      setFase('invalid');
      setPrimaryAngle(0);
      ultimaRepHabladaRef.current = 0;
      ultimoErrorHabladoRef.current = '';
      hablar('Reinicio', true);
    }
  };

  const handleFinalizar = () => {
    try {
      Speech.stop();
    } catch (e) {}
    if (onCompletarSerie) {
      onCompletarSerie(reps);
    }
    onCerrar();
  };

  const getFaseEtiqueta = (phase: string) => {
    switch (phase) {
      case 'readyUp':
        return 'EN POSICIÓN';
      case 'descending':
        return 'DESCENSO';
      case 'bottom':
        return 'FONDO';
      case 'ascending':
        return 'SUBIENDO';
      default:
        return 'BUSCANDO';
    }
  };

  // Color de postura
  const colorPostura = humanoDetectado
    ? (isFormCorrect ? '#10B981' : ColoresApp.primario)
    : '#94A3B8';

  // Gráfica circular para Ángulo (rango 0 - 180)
  const ratioAngulo = Math.min(Math.max(primaryAngle / 180, 0), 1);
  const offsetAngulo = GAUGE_CIRCUMFERENCE - ratioAngulo * GAUGE_CIRCUMFERENCE;

  // Permiso de Cámara
  if (!permission || !permission.granted) {
    return (
      <Modal animationType="slide" visible={visible} onRequestClose={onCerrar}>
        <SafeAreaView style={styles.permissionContainer}>
          <View style={styles.permissionCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera-outline" size={40} color={ColoresApp.primario} />
            </View>
            <Text style={styles.permissionTitle}>PERMISO DE CÁMARA</Text>
            <Text style={styles.permissionText}>
              Meta Fit necesita acceso a tu cámara para que la IA de Google MediaPipe detecte tu cuerpo
              y cuente tus repeticiones biomecánicamente.
            </Text>

            <TouchableOpacity style={styles.botonPermiso} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={styles.botonPermisoTexto}>ACTIVAR CÁMARA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonCancelar} onPress={onCerrar} activeOpacity={0.7}>
              <Text style={styles.botonCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={handleFinalizar}>
      <View style={styles.container}>
        {/* WebView con Google MediaPipe y Cámara en Tiempo Real */}
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: MEDIAPIPE_HTML, baseUrl: 'https://localhost' }}
          style={StyleSheet.absoluteFill}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          mixedContentMode="always"
          userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          onMessage={handleWebViewMessage}
        />

        {/* Pantalla de Carga Inicial Sobria */}
        {cargando && (
          <View style={styles.loaderContainer} pointerEvents="none">
            <ActivityIndicator size="small" color={ColoresApp.primario} />
            <Text style={styles.loaderTexto}>CALIBRANDO SENSORES IA</Text>
          </View>
        )}

        {/* Notificación de Error */}
        {errorCamara && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={32} color={ColoresApp.primario} style={{ marginBottom: 8 }} />
            <Text style={styles.errorTitulo}>ERROR AL ABRIR CÁMARA</Text>
            <Text style={styles.errorMensaje}>{errorCamara}</Text>
            <TouchableOpacity style={styles.botonReintentar} onPress={handleReiniciar}>
              <Text style={styles.botonReintentarTexto}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CAPA HUD FLUIDA (Safe Area View sin bloquear toques en pantalla) */}
        <SafeAreaView style={styles.hudSafeArea} pointerEvents="box-none">

          {/* 1. SECCIÓN SUPERIOR: Top Bar + Indicadores */}
          <View pointerEvents="box-none">
            {/* Top Bar con botones circulares */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.tabCirculo} onPress={handleFinalizar} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color="#000000" />
              </TouchableOpacity>

              <View style={styles.badgeEjercicio}>
                <Text style={styles.badgeEjercicioTexto}>{ejercicio.nombre.toUpperCase()}</Text>
                <View style={styles.aiPuntoRow}>
                  <View
                    style={[
                      styles.puntoIA,
                      { backgroundColor: humanoDetectado ? '#10B981' : '#F59E0B' },
                    ]}
                  />
                  <Text style={styles.textoEstadoIA}>
                    {humanoDetectado ? 'CONECTADO' : 'BUSCANDO'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.tabCirculo} onPress={handleToggleCamara} activeOpacity={0.8}>
                <Ionicons name="camera-reverse-outline" size={22} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Fila de Indicadores: Ángulo en vivo y Fase (Estilo Análisis Biométrico) */}
            <View style={styles.indicadoresFila} pointerEvents="box-none">
              {/* Tarjeta Ángulo con Micro-Gráfica Circular */}
              <View style={styles.tarjetaFija}>
                <Text style={styles.tarjetaTitulo}>ÁNGULO EN VIVO</Text>
                <View style={styles.tarjetaContenido}>
                  <View style={styles.gaugeWrapper}>
                    <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
                      <Circle
                        cx={GAUGE_CENTER}
                        cy={GAUGE_CENTER}
                        r={GAUGE_RADIUS}
                        stroke="#F1F5F9"
                        strokeWidth={GAUGE_STROKE}
                        fill="none"
                      />
                      <Circle
                        cx={GAUGE_CENTER}
                        cy={GAUGE_CENTER}
                        r={GAUGE_RADIUS}
                        stroke={colorPostura}
                        strokeWidth={GAUGE_STROKE}
                        fill="none"
                        strokeDasharray={GAUGE_CIRCUMFERENCE}
                        strokeDashoffset={offsetAngulo}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${GAUGE_CENTER} ${GAUGE_CENTER})`}
                      />
                    </Svg>
                    <Text style={styles.gaugeCenterLabel}>°</Text>
                  </View>

                  <View style={styles.datosColumna}>
                    <Text style={[styles.numeroGrande, { color: colorPostura }]}>
                      {humanoDetectado ? `${Math.round(primaryAngle)}°` : '--°'}
                    </Text>
                    <Text style={styles.unidadTexto} numberOfLines={1}>
                      {ejercicio.articulacionClave.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tarjeta Fase del Motor */}
              <View style={styles.tarjetaFija}>
                <Text style={styles.tarjetaTitulo}>FASE DEL MOTOR</Text>
                <View style={styles.datosColumnaCentral}>
                  <Text style={styles.faseValorTexto} numberOfLines={1}>
                    {humanoDetectado ? getFaseEtiqueta(fase) : 'ESPERANDO'}
                  </Text>
                  <View style={[styles.posturaPill, { backgroundColor: isFormCorrect ? '#ECFDF5' : '#FEF2F2' }]}>
                    <Text
                      style={[
                        styles.posturaPillTexto,
                        { color: humanoDetectado ? (isFormCorrect ? '#10B981' : ColoresApp.primario) : '#94A3B8' },
                      ]}
                    >
                      {humanoDetectado ? (isFormCorrect ? 'CORRECTA' : 'CORREGIR') : 'INACTIVA'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 2. SECCIÓN CENTRAL: CONTADOR GIGANTE DE REPETICIONES (VISIBLE A DISTANCIA) */}
          <View style={styles.centerHud} pointerEvents="none">
            <View style={styles.repBadgeContenedor}>
              <Text style={styles.repLabel}>REPETICIONES</Text>
              <Text style={[styles.repNumero, { color: humanoDetectado ? colorPostura : '#64748B' }]}>
                {reps}
              </Text>
            </View>
          </View>

          {/* 3. SECCIÓN INFERIOR: Feedback Banner + Navbar Flotante */}
          <View pointerEvents="box-none">
            {/* Banner de Feedback en Tiempo Real */}
            <View style={[styles.feedbackBanner, { borderColor: colorPostura }]}>
              <Ionicons
                name={humanoDetectado ? (isFormCorrect ? 'checkmark-circle' : 'warning') : 'body'}
                size={22}
                color={humanoDetectado ? colorPostura : '#F59E0B'}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.feedbackTexto} numberOfLines={2}>
                {feedback}
              </Text>
            </View>

            {/* Barra Flotante de Controles (Estilo Análisis Biométrico) */}
            <View style={styles.floatingBar}>
              {/* Botón Reiniciar Conteo */}
              <TouchableOpacity
                onPress={handleReiniciar}
                style={styles.botonSecundarioPill}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.botonSecundarioTexto}>Reiniciar</Text>
              </TouchableOpacity>

              {/* Botón Finalizar Serie */}
              <TouchableOpacity
                onPress={handleFinalizar}
                style={styles.tabBotonRojo}
                activeOpacity={0.85}
              >
                <Text style={styles.tabBotonRojoTexto}>FINALIZAR SERIE</Text>
              </TouchableOpacity>
            </View>
          </View>

        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loaderTexto: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 1,
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 25,
  },
  errorTitulo: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  errorMensaje: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  botonReintentar: {
    backgroundColor: ColoresApp.primario,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  botonReintentarTexto: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // Contenedor Safe Area
  hudSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tabCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeEjercicio: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeEjercicioTexto: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.6,
  },
  aiPuntoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  puntoIA: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  textoEstadoIA: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  // Fila de Indicadores Superiores
  indicadoresFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 8,
  },
  tarjetaFija: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tarjetaTitulo: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tarjetaContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeWrapper: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenterLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
  },
  datosColumna: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 8,
  },
  datosColumnaCentral: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroGrande: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  unidadTexto: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    marginTop: 1,
  },
  faseValorTexto: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  posturaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  posturaPillTexto: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Centro HUD: Repeticiones Grandes y Visibles
  centerHud: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  repBadgeContenedor: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  repLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  repNumero: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
  },

  // Feedback Banner
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  feedbackTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 16,
  },

  // Floating Bar Inferior
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 58,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  botonSecundarioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  botonSecundarioTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  tabBotonRojo: {
    flex: 1,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ColoresApp.primario,
    borderRadius: 22,
    height: 42,
    paddingHorizontal: 16,
    shadowColor: ColoresApp.primario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  tabBotonRojoTexto: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Permisos
  permissionContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  botonPermiso: {
    width: '100%',
    backgroundColor: ColoresApp.primario,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  botonPermisoTexto: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  botonCancelar: {
    paddingVertical: 8,
  },
  botonCancelarTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
