import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { ColoresApp } from '../theme/colors';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Geometría para micro-gráficas circulares en tarjetas
const GAUGE_SIZE = 54;
const GAUGE_STROKE = 5;
const GAUGE_RADIUS = 21;
const GAUGE_CENTER = GAUGE_SIZE / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

// HTML optimizado con Google MediaPipe Pose en tiempo real a 30 FPS
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
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }
    #canvas {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
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

    if (!navigator.mediaDevices) navigator.mediaDevices = {};
    if (!navigator.mediaDevices.getUserMedia) {
      const legacy = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.getUserMedia;
      if (legacy) {
        navigator.mediaDevices.getUserMedia = function(c) {
          return new Promise((resolve, reject) => legacy.call(navigator, c, resolve, reject));
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
        sendToApp({ type: 'ERROR', message: err.message });
      }
    }

    function onPoseResults(results) {
      canvas.width = video.videoWidth || window.innerWidth;
      canvas.height = video.videoHeight || window.innerHeight;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#FF2D55', lineWidth: 1.5 });
        drawLandmarks(ctx, results.poseLandmarks, { color: '#FFFFFF', fillColor: '#FF2D55', lineWidth: 1, radius: 2.5 });

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
          video: { facingMode: currentFacing, width: { ideal: 640 }, height: { ideal: 480 } },
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

export const PantallaCamaraBiometrica = ({ route }: any) => {
  const navigation = useNavigation();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cargandoIA, setCargandoIA] = useState(true);
  const [humanoDetectado, setHumanoDetectado] = useState(false);

  // Solicitar activación de Cámara al entrar
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
    })();
  }, []);

  // Posición dinámica en tiempo real (milisegundo a milisegundo)
  const [lineaCabezaY, setLineaCabezaY] = useState<number | null>(null);
  const [lineaPisoY, setLineaPisoY] = useState<number>(SCREEN_HEIGHT * 0.82);

  // Valores en tiempo real que NUNCA se congelan
  const [estaturaEnVivo, setEstaturaEnVivo] = useState<number | null>(null);
  const [pesoEnVivo, setPesoEnVivo] = useState<number | null>(null);

  // Medida fijada tras 4 segundos inmóvil o por botón manual
  const [tiempoQuieto, setTiempoQuieto] = useState(0); // 0.0 a 4.0s
  const [medidaFijada, setMedidaFijada] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<{ peso: number; estatura: number } | null>(null);

  // Contador de 10 segundos para actualizar la medida fijada
  const [segundosRestantes10s, setSegundosRestantes10s] = useState<number>(10);

  const webViewRef = useRef<any>(null);
  const ultimosPuntosRef = useRef<{ x: number; y: number } | null>(null);

  // Filtros adaptativos cinemáticos (Buffer rodante + EMA + Histéresis de reposo)
  const estaturaSuavizadaRef = useRef<number | null>(null);
  const pesoSuavizadoRef = useRef<number | null>(null);
  const lineaCabezaYSuavizadaRef = useRef<number | null>(null);
  const lineaPisoYSuavizadaRef = useRef<number | null>(null);
  const estaturaEnteraFijadaRef = useRef<number | null>(null);
  const pesoEnteroFijadoRef = useRef<number | null>(null);
  const bufferEstaturaRef = useRef<number[]>([]);
  const bufferPesoRef = useRef<number[]>([]);

  // Refs para que el intervalo y guardado lean siempre valores frescos y persistentes
  const estaturaEnVivoRef = useRef<number | null>(null);
  const pesoEnVivoRef = useRef<number | null>(null);
  const lastValidEstaturaRef = useRef<number | null>(null);
  const lastValidPesoRef = useRef<number | null>(null);
  const resultadoFinalRef = useRef<{ peso: number; estatura: number } | null>(null);
  const yaGuardadoRef = useRef<boolean>(false);
  const medidaFijadaRef = useRef<boolean>(false);
  const tiempoFijadoTimestampRef = useRef<number>(0);
  const contadorGestoRef = useRef<number>(0);
  const gestoEnProgresoRef = useRef<boolean>(false);
  estaturaEnVivoRef.current = estaturaEnVivo;
  pesoEnVivoRef.current = pesoEnVivo;
  resultadoFinalRef.current = resultadoFinal;
  medidaFijadaRef.current = medidaFijada;

  // Reproductor de voz en español
  const hablar = (texto: string) => {
    try {
      Speech.stop();
      Speech.speak(texto, {
        language: 'es-US',
        rate: 0.95,
        pitch: 1.0,
      });
    } catch (e) {}
  };

  // Detener voz al salir de la pantalla
  useEffect(() => {
    return () => {
      try {
        Speech.stop();
      } catch (e) {}
    };
  }, []);

  // Guardado infalible de la medición
  const guardarYVolver = () => {
    if (yaGuardadoRef.current) return;
    const finalRes = resultadoFinalRef.current;
    const pesoAGuardar = (finalRes && finalRes.peso)
      ? Math.round(finalRes.peso)
      : (pesoEnVivoRef.current ? Math.round(pesoEnVivoRef.current) : lastValidPesoRef.current);
    const estaturaAGuardar = (finalRes && finalRes.estatura)
      ? Math.round(finalRes.estatura)
      : (estaturaEnVivoRef.current ? Math.round(estaturaEnVivoRef.current) : lastValidEstaturaRef.current);

    if (pesoAGuardar && estaturaAGuardar) {
      yaGuardadoRef.current = true;
      hablar('Guardado.');
      route.params?.onAnalisisCompletado(pesoAGuardar, estaturaAGuardar);
      navigation.goBack();
    }
  };

  // Temporizador: actualiza y anuncia la nueva medida periódicamente si cambia la postura (no guarda por tiempo)
  useEffect(() => {
    let timer: any = null;
    if (medidaFijada) {
      setSegundosRestantes10s(8);
      timer = setInterval(() => {
        setSegundosRestantes10s((prev) => {
          if (prev <= 1) {
            // Actualiza con la muestra más reciente en vivo por si cambió la lectura
            const est = estaturaEnVivoRef.current;
            const pes = pesoEnVivoRef.current;
            if (est !== null && pes !== null) {
              const estR = Math.round(est);
              const pesR = Math.round(pes);
              setResultadoFinal({ estatura: estR, peso: pesR });
              hablar(`Estatura de ${estR} centímetros y peso de ${pesR} kilos. Levanta la mano para guardar.`);
            }
            return 8; // Reinicia la cuenta para la siguiente actualización
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [medidaFijada]);

  // Captura manual instantánea con botón (entero sin decimales)
  const capturarManual = () => {
    const est = estaturaEnVivoRef.current || lastValidEstaturaRef.current;
    const pes = pesoEnVivoRef.current || lastValidPesoRef.current;
    if (est !== null && pes !== null) {
      const estR = Math.round(est);
      const pesR = Math.round(pes);
      setMedidaFijada(true);
      medidaFijadaRef.current = true;
      tiempoFijadoTimestampRef.current = Date.now();
      setResultadoFinal({ estatura: estR, peso: pesR });
      setSegundosRestantes10s(8);
      hablar(`Estatura de ${estR} centímetros y peso de ${pesR} kilos. Levanta la mano para guardar.`);
    }
  };

  // Mensajes de MediaPipe y comandos de voz desde la WebView
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'CAMERA_READY') {
        setCargandoIA(false);
      }

      if (data.type === 'NO_HUMAN') {
        setHumanoDetectado(false);
        setEstaturaEnVivo(null);
        setPesoEnVivo(null);
        setLineaCabezaY(null);
        setTiempoQuieto(0);
        estaturaSuavizadaRef.current = null;
        pesoSuavizadoRef.current = null;
        lineaCabezaYSuavizadaRef.current = null;
        lineaPisoYSuavizadaRef.current = null;
        estaturaEnteraFijadaRef.current = null;
        pesoEnteroFijadoRef.current = null;
        bufferEstaturaRef.current = [];
        bufferPesoRef.current = [];
        return;
      }

      if (data.type === 'LANDMARKS' && Array.isArray(data.landmarks) && data.landmarks.length > 0) {
        setCargandoIA(false);
        setHumanoDetectado(true);

        const lm = data.landmarks;

        // 1. Coronilla anatómica de la cabeza (bien al ras y arriba del cabello)
        const nariz = lm[0];
        const ojoIzq = lm[2];
        const ojoDer = lm[5];
        const orejaIzq = lm[7];
        const orejaDer = lm[8];
        const bocaIzq = lm[9];
        const bocaDer = lm[10];

        const ojosY = (ojoIzq.y + ojoDer.y) / 2;
        const narizY = nariz.y;
        const bocaY = ((bocaIzq?.y || narizY) + (bocaDer?.y || narizY)) / 2;

        // Proporciones craneales y faciales antropométricas reales
        const distOjosBoca = Math.abs(bocaY - ojosY);
        const distOjosNariz = Math.max(0.010, Math.abs(narizY - ojosY));
        const distOrejas = orejaIzq && orejaDer 
          ? Math.hypot(orejaIzq.x - orejaDer.x, orejaIzq.y - orejaDer.y)
          : 0;

        // Posición ajustada exactamente un dedo más abajo para calzar al ras superior de la cabeza
        let offsetCranial = distOjosNariz * 4.3;
        if (distOjosBoca > 0.015) {
          offsetCranial = Math.max(offsetCranial, distOjosBoca * 1.78);
        }
        if (distOrejas > 0.02) {
          offsetCranial = Math.max(offsetCranial, distOrejas * 0.78);
        }
        const deltaMinimo = Math.max(0.038, distOjosNariz * 4.0);
        offsetCranial = Math.max(offsetCranial, deltaMinimo);

        const rawCoronillaYNorm = Math.max(0.01, ojosY - offsetCranial);
        const targetCabezaY = rawCoronillaYNorm * SCREEN_HEIGHT;

        // Suavizado EMA responsivo para que la línea siga la cabeza fluidamente al agacharse
        const smoothCabezaY = lineaCabezaYSuavizadaRef.current === null
          ? targetCabezaY
          : lineaCabezaYSuavizadaRef.current + 0.28 * (targetCabezaY - lineaCabezaYSuavizadaRef.current);
        lineaCabezaYSuavizadaRef.current = smoothCabezaY;
        setLineaCabezaY(smoothCabezaY);

        // 2. Nivel del suelo / pies
        const tobilloY = Math.max(lm[27]?.y || 0.8, lm[28]?.y || 0.8);
        const talonY = Math.max(lm[29]?.y || tobilloY, lm[30]?.y || tobilloY);
        const pieY = Math.max(lm[31]?.y || talonY, lm[32]?.y || talonY);
        const rawSueloYNorm = Math.min(0.96, Math.max(talonY, pieY));
        const targetPisoY = rawSueloYNorm * SCREEN_HEIGHT;

        // Suavizado EMA para la línea de suelo
        const smoothPisoY = lineaPisoYSuavizadaRef.current === null
          ? targetPisoY
          : lineaPisoYSuavizadaRef.current + 0.20 * (targetPisoY - lineaPisoYSuavizadaRef.current);
        lineaPisoYSuavizadaRef.current = smoothPisoY;
        setLineaPisoY(smoothPisoY);

        // 3. Estatura dinámica en tiempo real
        const coronillaYNorm = smoothCabezaY / SCREEN_HEIGHT;
        const sueloYNorm = smoothPisoY / SCREEN_HEIGHT;
        const alturaRelativa = Math.max(0.18, sueloYNorm - coronillaYNorm);

        // Multiplicador calibrado con mediciones reales en vivo:
        // Persona 1: ~0.624 => 173 cm | Persona 2: ~0.597 => 167-169 cm | Persona 3: ~0.556 => 154 cm
        const rawEstatura = Math.max(60.0, Math.min(230.0, alturaRelativa * 281.0 - 2.0));

        // Buffer rodante de 8 muestras para anular el temblor de la mano y vibración del celular
        const bufEst = bufferEstaturaRef.current;
        bufEst.push(rawEstatura);
        if (bufEst.length > 8) bufEst.shift();
        const estaturaBuffer = bufEst.reduce((a, b) => a + b, 0) / bufEst.length;

        // Filtro cinemático de bajo ruido:
        // - Temblor de mano / celular (delta <= 2.8 cm): alpha = 0.015 (bloquea la oscilación)
        // - Agacharse o levantarse intencionalmente (delta > 2.8 cm): alpha = 0.35 (seguimiento continuo)
        const prevEstatura = estaturaSuavizadaRef.current;
        let estaturaFiltrada: number;
        if (prevEstatura === null) {
          estaturaFiltrada = estaturaBuffer;
        } else {
          const delta = Math.abs(estaturaBuffer - prevEstatura);
          const alpha = delta > 6.0 ? 0.45 : delta > 2.8 ? 0.32 : 0.015;
          estaturaFiltrada = prevEstatura + alpha * (estaturaBuffer - prevEstatura);
        }
        estaturaSuavizadaRef.current = estaturaFiltrada;

        // Histéresis reforzada (1.25 cm):
        // Elimina por completo el parpadeo de números enteros mientras estés en reposo
        const enteroPrev = estaturaEnteraFijadaRef.current;
        let estaturaVisible: number;
        if (enteroPrev === null) {
          estaturaVisible = Math.round(estaturaFiltrada);
        } else {
          const diffEntero = Math.abs(estaturaFiltrada - enteroPrev);
          if (diffEntero >= 1.25) {
            estaturaVisible = Math.round(estaturaFiltrada);
          } else {
            estaturaVisible = enteroPrev;
          }
        }
        estaturaEnteraFijadaRef.current = estaturaVisible;
        lastValidEstaturaRef.current = estaturaVisible;
        setEstaturaEnVivo(estaturaVisible);

        // 4. Peso volumétrico en tiempo real (calibrado a 72 kg exactos para 168 cm)
        const anchoHombros = Math.abs(lm[11].x - lm[12].x);
        const anchoCodos = Math.abs(lm[13].x - lm[14].x);
        const anchoMuñecas = Math.abs(lm[15].x - lm[16].x);
        const anchoCaderas = Math.abs(lm[23].x - lm[24].x);
        const anchoPiernas = Math.abs(lm[25].x - lm[26].x);

        // La ropa ancha o silueta robusta ensancha el torso, codos, muñecas y piernas:
        const anchoTorsoSuperior = Math.max(anchoHombros, anchoCodos * 0.65);
        const anchoTorsoMedio = Math.max(anchoCaderas, anchoMuñecas * 0.58);
        const anchoTorsoInferior = Math.max(anchoCaderas, anchoPiernas * 0.85);

        // Ancho de silueta ponderado de cuerpo completo y vestimenta
        const anchoSilueta = (
          anchoTorsoSuperior * 0.35 +
          anchoCodos * 0.25 +
          anchoTorsoMedio * 0.25 +
          anchoTorsoInferior * 0.15
        );

        // Ancho de referencia estándar calibrado alométricamente con datos reales:
        // A escala de distancia estándar, el ancho anatómico escala con exponente sublineal (0.25)
        // para mantener proporciones anatómicas correctas en personas de estatura alta, media o baja
        const anchoReferencia = 0.150 * Math.pow(estaturaFiltrada / 168.0, 0.25);
        
        // Ratio de contextura / holgura de la prenda (1.0 = estándar, >1.12 = robusto/ropa ancha, <0.92 = delgado)
        const ratioHolgura = Math.max(0.65, Math.min(1.85, anchoSilueta / Math.max(0.04, anchoReferencia)));
        
        // Factor volumétrico físico
        const factorVolumen = Math.pow(ratioHolgura, 1.1);
        const alturaM = estaturaFiltrada / 100.0;

        // IMC base calibrado a 25.5 (calibración exacta con datos reales: P1=85kg, P2=80kg, P3=65kg)
        const imcEstimado = Math.max(16.0, Math.min(48.0, 25.5 * factorVolumen));
        const rawPeso = Math.max(30.0, Math.min(190.0, imcEstimado * (alturaM * alturaM)));

        // Buffer rodante de 8 muestras para peso
        const bufPes = bufferPesoRef.current;
        bufPes.push(rawPeso);
        if (bufPes.length > 8) bufPes.shift();
        const pesoBuffer = bufPes.reduce((a, b) => a + b, 0) / bufPes.length;

        const prevPeso = pesoSuavizadoRef.current;
        let pesoFiltrado: number;
        if (prevPeso === null) {
          pesoFiltrado = pesoBuffer;
        } else {
          const deltaP = Math.abs(pesoBuffer - prevPeso);
          // Si el ancho o volumen cambia (deltaP > 2.2 kg), actualiza ágilmente
          const alphaP = deltaP > 4.5 ? 0.40 : deltaP > 2.2 ? 0.25 : 0.015;
          pesoFiltrado = prevPeso + alphaP * (pesoBuffer - prevPeso);
        }
        pesoSuavizadoRef.current = pesoFiltrado;

        // Histéresis reforzada de peso (1.25 kg): elimina oscilación en reposo
        const enteroPrevPeso = pesoEnteroFijadoRef.current;
        let pesoVisible: number;
        if (enteroPrevPeso === null) {
          pesoVisible = Math.round(pesoFiltrado);
        } else {
          if (Math.abs(pesoFiltrado - enteroPrevPeso) >= 1.25) {
            pesoVisible = Math.round(pesoFiltrado);
          } else {
            pesoVisible = enteroPrevPeso;
          }
        }
        pesoEnteroFijadoRef.current = pesoVisible;
        lastValidPesoRef.current = pesoVisible;
        setPesoEnVivo(pesoVisible);

        // 5. Estabilidad: 4 segundos quieto toma la medida automáticamente
        if (!medidaFijada) {
          const puntoActual = { x: nariz.x, y: nariz.y };
          if (ultimosPuntosRef.current) {
            const dx = Math.abs(puntoActual.x - ultimosPuntosRef.current.x);
            const dy = Math.abs(puntoActual.y - ultimosPuntosRef.current.y);
            const movimiento = Math.sqrt(dx * dx + dy * dy);

            if (movimiento < 0.014) {
              setTiempoQuieto((prev) => {
                const nuevo = Math.min(4.0, prev + 0.15);
                if (nuevo >= 4.0) {
                  setMedidaFijada(true);
                  medidaFijadaRef.current = true;
                  tiempoFijadoTimestampRef.current = Date.now();
                  setResultadoFinal({ estatura: estaturaVisible, peso: pesoVisible });
                  setSegundosRestantes10s(8);
                  hablar(`Estatura de ${estaturaVisible} centímetros y peso de ${pesoVisible} kilos. Levanta la mano para guardar.`);
                }
                return nuevo;
              });
            } else {
              setTiempoQuieto(0);
            }
          }
          ultimosPuntosRef.current = puntoActual;
        }

        // 6. Gesto deliberado para Guardar: SOLO se evalúa si ya se fijó la medición y pasaron 1.5s
        const medidaYaLista = medidaFijadaRef.current && (Date.now() - tiempoFijadoTimestampRef.current > 1500);

        if (medidaYaLista) {
          const muñecaDer = lm[16];
          const muñecaIzq = lm[15];
          const hombroDer = lm[12];
          const hombroIzq = lm[11];

          // Gesto intencional claro:
          // 1. Mano levantada saludando o arriba de la cara/hombro (muñeca por encima de la nariz o muy arriba del hombro)
          // 2. O brazo extendido al frente bien visible hacia la cámara
          const manoArribaCara = Boolean(
            (muñecaDer && (muñecaDer.y < nariz.y || (hombroDer && muñecaDer.y < hombroDer.y - 0.10))) ||
            (muñecaIzq && (muñecaIzq.y < nariz.y || (hombroIzq && muñecaIzq.y < hombroIzq.y - 0.10)))
          );

          const brazoAlFrente = Boolean(
            (muñecaDer && hombroDer && muñecaDer.z < hombroDer.z - 0.26 && muñecaDer.y < hombroDer.y) ||
            (muñecaIzq && hombroIzq && muñecaIzq.z < hombroIzq.z - 0.26 && muñecaIzq.y < hombroIzq.y)
          );

          const gestoGuardarActivo = manoArribaCara || brazoAlFrente;

          if (gestoGuardarActivo) {
            contadorGestoRef.current += 1;
            if (contadorGestoRef.current >= 20) { // ~0.65s sostenido
              gestoEnProgresoRef.current = true;
              guardarYVolver();
            }
          } else {
            contadorGestoRef.current = Math.max(0, contadorGestoRef.current - 2);
          }
        } else {
          contadorGestoRef.current = 0;
        }
      }
    } catch {}
  };

  const toggleFacing = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('window.toggleCameraFacing(); true;');
    }
  };

  if (!cameraPermission) return <View style={styles.container} />;

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color={ColoresApp.primario} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text style={styles.textoPermiso}>
          Meta Fit requiere permiso de Cámara para el análisis biométrico corporal.
        </Text>
        <TouchableOpacity 
          style={styles.botonPermiso} 
          onPress={requestCameraPermission}
        >
          <Text style={styles.textoBotonPermiso}>Activar Cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Gráfica circular para Estatura (rango 80 - 220)
  const ratioEstatura = estaturaEnVivo ? Math.min(Math.max((estaturaEnVivo - 80) / 140, 0), 1) : 0;
  const offsetEstatura = GAUGE_CIRCUMFERENCE - ratioEstatura * GAUGE_CIRCUMFERENCE;

  // Gráfica circular para Peso (rango 30 - 150)
  const ratioPeso = pesoEnVivo ? Math.min(Math.max((pesoEnVivo - 30) / 120, 0), 1) : 0;
  const offsetPeso = GAUGE_CIRCUMFERENCE - ratioPeso * GAUGE_CIRCUMFERENCE;

  return (
    <View style={styles.container}>
      {/* WebView con cámara a 30 FPS */}
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

      {/* Cargador inicial sobrio */}
      {cargandoIA && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={ColoresApp.primario} />
          <Text style={styles.loaderTexto}>CALIBRANDO SENSORES</Text>
        </View>
      )}

      {/* Capa de Interfaz y Tarjetas Prolijas */}
      <View style={[styles.overlay, StyleSheet.absoluteFill]} pointerEvents="box-none">
        
        {/* PARTE SUPERIOR: 2 TARJETAS FIJAS CON GRÁFICAS (ESTATURA Y PESO) */}
        <View style={styles.headerContenedor}>
          
          <View style={styles.tarjetasFila}>
            
            {/* Tarjeta 1: ESTATURA */}
            <View style={styles.tarjetaFija}>
              <Text style={styles.tarjetaTitulo}>ESTATURA</Text>
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
                      stroke={ColoresApp.primario}
                      strokeWidth={GAUGE_STROKE}
                      fill="none"
                      strokeDasharray={GAUGE_CIRCUMFERENCE}
                      strokeDashoffset={offsetEstatura}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${GAUGE_CENTER} ${GAUGE_CENTER})`}
                    />
                  </Svg>
                  <Text style={styles.gaugeCenterLabel}>CM</Text>
                </View>

                <View style={styles.datosColumna}>
                  <Text style={styles.numeroGrande}>
                    {estaturaEnVivo !== null ? `${estaturaEnVivo}` : '--'}
                  </Text>
                  <Text style={styles.unidadTexto}>CM</Text>
                </View>
              </View>
            </View>

            {/* Tarjeta 2: PESO */}
            <View style={styles.tarjetaFija}>
              <Text style={styles.tarjetaTitulo}>PESO</Text>
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
                      stroke="#000000"
                      strokeWidth={GAUGE_STROKE}
                      fill="none"
                      strokeDasharray={GAUGE_CIRCUMFERENCE}
                      strokeDashoffset={offsetPeso}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${GAUGE_CENTER} ${GAUGE_CENTER})`}
                    />
                  </Svg>
                  <Text style={styles.gaugeCenterLabel}>KG</Text>
                </View>

                <View style={styles.datosColumna}>
                  <Text style={styles.numeroGrande}>
                    {pesoEnVivo !== null ? `${pesoEnVivo}` : '--'}
                  </Text>
                  <Text style={styles.unidadTexto}>KG</Text>
                </View>
              </View>
            </View>

          </View>

          {/* Tarjeta Fija de Valores Guardados (Actualiza cada 10s) */}
          {medidaFijada && resultadoFinal && (
            <View style={styles.tarjetaGuardadosFija}>
              <View style={styles.guardadosFila}>
                <View style={styles.guardadosItem}>
                  <Text style={styles.guardadosEtiqueta}>ESTATURA FIJADA</Text>
                  <Text style={styles.guardadosValor}>{resultadoFinal.estatura} CM</Text>
                </View>
                <View style={styles.divisorVertical} />
                <View style={styles.guardadosItem}>
                  <Text style={styles.guardadosEtiqueta}>PESO FIJADO</Text>
                  <Text style={styles.guardadosValor}>{resultadoFinal.peso} KG</Text>
                </View>
                <View style={styles.divisorVertical} />
                <View style={styles.guardadosItem}>
                  <Text style={styles.guardadosEtiqueta}>ACTUALIZA EN</Text>
                  <Text style={styles.guardadosContador}>{segundosRestantes10s}S</Text>
                </View>
              </View>
            </View>
          )}

        </View>

        {/* LÍNEA LÁSER DINÁMICA DE CABEZA */}
        {humanoDetectado && lineaCabezaY !== null && (
          <View style={[styles.lineaCabezaContenedor, { top: lineaCabezaY }]} pointerEvents="none">
            <View style={styles.lineaLaser} />
            <View style={styles.etiquetaPuntero}>
              <Text style={styles.etiquetaPunteroTexto}>
                {estaturaEnVivo !== null ? `${estaturaEnVivo} CM` : '-- CM'}
              </Text>
            </View>
          </View>
        )}

        {/* LÍNEA BASE DE SUELO */}
        {humanoDetectado && (
          <View style={[styles.lineaSueloContenedor, { top: lineaPisoY }]} pointerEvents="none">
            <View style={styles.lineaBasePiso} />
            <View style={styles.etiquetaSuelo}>
              <Text style={styles.etiquetaSueloTexto}>0 CM</Text>
            </View>
          </View>
        )}

        {/* NAVBAR FLOTANTE INFERIOR CON 2 BOTONES: CAPTURAR Y GUARDAR */}
        <View style={styles.floatingWrapper} pointerEvents="box-none">
          <View style={styles.floatingBar}>
            
            {/* Botón Salir */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.tabCirculo}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#000000" />
            </TouchableOpacity>

            {/* Botón 1: CAPTURAR (ROJO) */}
            <TouchableOpacity
              onPress={capturarManual}
              style={styles.tabBotonRojo}
              activeOpacity={0.85}
            >
              <Text style={styles.tabBotonRojoTexto}>CAPTURAR</Text>
            </TouchableOpacity>

            {/* Botón 2: GUARDAR (ROJO) */}
            <TouchableOpacity
              onPress={guardarYVolver}
              style={[
                styles.tabBotonRojo,
                !resultadoFinal && !estaturaEnVivo && !lastValidEstaturaRef.current && { opacity: 0.5 },
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.tabBotonRojoTexto}>GUARDAR</Text>
            </TouchableOpacity>

            {/* Botón Cambiar Cámara */}
            <TouchableOpacity
              onPress={toggleFacing}
              style={styles.tabCirculo}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-reverse-outline" size={22} color="#000000" />
            </TouchableOpacity>

          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  textoPermiso: { color: '#FFF', textAlign: 'center', marginBottom: 20 },
  botonPermiso: { backgroundColor: ColoresApp.primario, padding: 15, borderRadius: 10, marginHorizontal: 40 },
  textoBotonPermiso: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  overlay: { flex: 1, justifyContent: 'space-between' },

  // Encabezado con 2 Tarjetas Fijas (Estatura y Peso)
  headerContenedor: {
    marginHorizontal: 14,
    marginTop: Platform.OS === 'ios' ? 46 : 36,
  },
  tarjetasFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  tarjetaFija: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  tarjetaTitulo: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.8,
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
    letterSpacing: 0.5,
  },
  datosColumna: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  numeroGrande: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  unidadTexto: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },

  // Tarjeta de Valores Guardados
  tarjetaGuardadosFija: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    marginHorizontal: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  guardadosFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guardadosItem: {
    alignItems: 'center',
    flex: 1,
  },
  guardadosEtiqueta: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  guardadosValor: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  guardadosContador: {
    fontSize: 13,
    fontWeight: '900',
    color: ColoresApp.primario,
  },
  divisorVertical: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },

  // Línea Láser Dinámica (Cabeza)
  lineaCabezaContenedor: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 20,
    justifyContent: 'center',
    zIndex: 10,
  },
  lineaLaser: {
    width: '100%',
    height: 2,
    backgroundColor: ColoresApp.primario,
  },
  etiquetaPuntero: {
    position: 'absolute',
    right: 14,
    top: -12,
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  etiquetaPunteroTexto: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Línea de Suelo
  lineaSueloContenedor: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 20,
    justifyContent: 'center',
  },
  lineaBasePiso: {
    width: '100%',
    height: 2,
    backgroundColor: '#64748B',
  },
  etiquetaSuelo: {
    position: 'absolute',
    right: 14,
    top: -12,
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  etiquetaSueloTexto: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Navbar Flotante Inferior con 2 Botones: CAPTURAR y GUARDAR
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 14,
    right: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
    elevation: 10,
    zIndex: 999,
  },
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 60,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabBotonRojo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ColoresApp.primario,
    borderRadius: 22,
    height: 44,
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
});
