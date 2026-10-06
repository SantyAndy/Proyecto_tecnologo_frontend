/** Datos con los que se genera el código (.ino) de un Arduino UNO R4 WiFi. */
export interface ConfigSketch {
  nombreDispositivo: string;
  nombreFinca: string;
  arduinoId: number;
  clave: string;
  wifiSsid: string;
  wifiPassword: string;
  servidor: string;
  puerto: number;
  ruta: string;
  usarIpFija: boolean;
  ipFija: string;
  gateway: string;
  mascara: string;
}

/** Escapa un texto para ponerlo dentro de comillas en C++. */
function cadenaC(valor: string): string {
  return valor.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, '');
}

function partesIp(valor: string): number[] | null {
  const texto = valor.trim().split('.');
  const partes = texto.map((p) => Number(p));
  const valida = partes.length === 4 && texto.every((p) => /^\d{1,3}$/.test(p)) && partes.every((n) => n <= 255);
  return valida ? partes : null;
}

export function esIpValida(valor: string): boolean {
  return partesIp(valor) !== null;
}

/** "172.20.10.10" -> "172, 20, 10, 10" (si no es una IP válida devuelve 0, 0, 0, 0). */
function ipC(valor: string): string {
  return (partesIp(valor) ?? [0, 0, 0, 0]).join(', ');
}

/**
 * Genera el código completo listo para cargar en el Arduino.
 *
 * Montaje esperado:
 *  - DHT11 (temperatura y humedad del aire) en un pin digital.
 *  - YL-69 / HW-080 con placa LM393 (humedad del suelo) por su salida analógica AO.
 *  - Sensor de pH industrial con salida RS485 (Modbus RTU), conectado por un
 *    convertidor RS485-TTL al puerto serie por hardware (Serial1: D0/D1).
 */
export function generarSketch(c: ConfigSketch): string {
  return `// =====================================================================
//  Agroindustria Cafetera - Envío de datos de sensores
//  Dispositivo: ${cadenaC(c.nombreDispositivo) || 'Arduino ' + c.arduinoId}  |  Finca: ${cadenaC(c.nombreFinca)}
//  Placa: Arduino UNO R4 WiFi
//
//  Sensores (se detectan solos: conecta o desconecta cuando quieras;
//  un sensor que no está conectado no envía datos):
//    - DHT11 ............ temperatura y humedad del aire (pin D2)
//    - YL-69 + LM393 .... humedad del suelo (salida AO -> A1)
//    - pH industrial .... RS485 / Modbus RTU, por convertidor RS485-TTL
//                         (TXD del convertidor -> D0, RXD -> D1)
//
//  Librerías necesarias (Herramientas > Administrar bibliotecas):
//    - ArduinoHttpClient   (Arduino)
//    - ArduinoJson 7       (Benoit Blanchon)
//    - DHT sensor library  (Adafruit) + Adafruit Unified Sensor
// =====================================================================
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// --------------------------- WiFi ------------------------------------
// Cambia estos datos si el Arduino se conecta a otra red (siempre 2.4 GHz).
const char* WIFI_SSID     = "${cadenaC(c.wifiSsid)}";
const char* WIFI_PASSWORD = "${cadenaC(c.wifiPassword)}";

// ----------------------- Servidor Django -----------------------------
// IP del computador que corre Django con:
//   python manage.py runserver 0.0.0.0:${c.puerto}
// (con 127.0.0.1 o localhost el Arduino NO puede conectarse).
const char* SERVIDOR = "${cadenaC(c.servidor)}";
const int   PUERTO   = ${c.puerto};
const char* RUTA     = "${cadenaC(c.ruta)}";

// -------------------- Identidad del dispositivo ----------------------
// La clave se ve en la página (Dispositivos). No la compartas: con ella
// cualquiera podría enviar datos falsos a tu finca.
const int   ARDUINO_ID    = ${c.arduinoId};
const char* ARDUINO_CLAVE = "${cadenaC(c.clave)}";

// ---------------------- IP fija (opcional) ---------------------------
// 0 = la red asigna la IP automáticamente (recomendado).
// 1 = usa la IP fija de abajo (debe estar libre dentro de la red).
#define USAR_IP_FIJA ${c.usarIpFija ? 1 : 0}
#if USAR_IP_FIJA
IPAddress ipFija(${ipC(c.ipFija)});
IPAddress gateway(${ipC(c.gateway)});
IPAddress mascara(${ipC(c.mascara)});
#endif

// ------------------- DHT11 y humedad del suelo -----------------------
#define DHTPIN     2       // pin DATA del DHT11
#define DHTTYPE    DHT11
#define PIN_SUELO  A1      // salida AO (analógica) de la placa LM393, no la DO.
                           // No uses A4/A5: en el UNO R4 WiFi son también el bus I2C
                           // y sin sensor leen un valor fijo (~983) que parece un dato.

// Calibración de la humedad del suelo: lectura con el sensor al aire
// (seco = 0 %) y sumergido en agua (mojado = 100 %). Mira los valores
// "suelo crudo" en el Monitor Serie para ajustarlos.
const int SUELO_SECO   = 1023;
const int SUELO_MOJADO = 0;

// Detección del sensor de suelo: un pin analógico sin nada conectado "flota"
// y lee ruido. Para distinguirlo, el pin se carga a 0 V y se lee, y luego se
// carga a 5 V y se lee, dejando en ambos casos un tiempo de espera: un pin
// suelto se queda con lo que se le impuso (lecturas muy distintas), mientras
// que el sensor siempre vuelve a su propio valor (lecturas casi iguales).
// La espera es necesaria porque la placa LM393 tiene un condensador en AO.
const int SUELO_UMBRAL_SUELTO = 300;
const int SUELO_ESPERA_MS     = 15;

// --------------------- Sensor de pH (RS485) --------------------------

// Puerto serie hacia el convertidor RS485-TTL (D0 = RX, D1 = TX).
#define RS485 Serial1

// Si tu convertidor tiene pines DE y RE (módulo MAX485), únelos y pon
// aquí el pin del Arduino al que van. Si el convertidor es automático
// (solo VCC, TXD, RXD y GND, como el del diagrama), déjalo en -1.
const int PIN_DE_RE = -1;

// Dirección Modbus del sensor (casi siempre 1).
const uint8_t PH_DIRECCION = 1;

// Detección automática: se prueban estas velocidades y registros, que son
// los más comunes en sensores de pH de suelo RS485. Al encontrarlo, el
// Monitor Serie muestra la configuración; puedes fijarla abajo.
const long     PH_BAUDIOS_PROBAR[]   = {4800, 9600, 2400, 19200};
const uint16_t PH_REGISTROS_PROBAR[] = {0x0000, 0x0006, 0x0003};

// Configuración fija (opcional): pon PH_CONFIG_MANUAL en 1 y los valores
// que mostró la detección para no tener que detectar en cada arranque.
#define PH_CONFIG_MANUAL 0
const long     PH_BAUDIOS  = 4800;
const uint16_t PH_REGISTRO = 0x0000;
const float    PH_DIVISOR  = 100.0;   // pH = valor del registro / divisor

// Cada cuánto se envía una lectura (milisegundos).
const unsigned long INTERVALO_MS = 10000;

DHT dht(DHTPIN, DHTTYPE);
WiFiClient wifi;
HttpClient cliente(wifi, SERVIDOR, PUERTO);

// Configuración del sensor de pH en uso.
bool     phListo    = false;
long     phBaudios  = 0;
uint16_t phRegistro = 0;
float    phDivisor  = 100.0;
int      phFallos   = 0;

// ============================ Modbus RTU =============================

uint16_t crcModbus(const uint8_t* datos, size_t largo) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < largo; i++) {
    crc ^= datos[i];
    for (int b = 0; b < 8; b++) {
      crc = (crc & 1) ? (crc >> 1) ^ 0xA001 : (crc >> 1);
    }
  }
  return crc;
}

// Lee "cantidad" registros (función 0x03) a partir de "registro".
bool leerRegistros(uint8_t direccion, uint16_t registro, uint8_t cantidad, uint16_t* salida) {
  uint8_t pedido[8] = {
    direccion, 0x03,
    (uint8_t)(registro >> 8), (uint8_t)(registro & 0xFF),
    0x00, cantidad, 0, 0
  };
  uint16_t crc = crcModbus(pedido, 6);
  pedido[6] = crc & 0xFF;
  pedido[7] = crc >> 8;

  while (RS485.available()) RS485.read();   // descarta basura anterior

  if (PIN_DE_RE >= 0) digitalWrite(PIN_DE_RE, HIGH);
  RS485.write(pedido, sizeof(pedido));
  RS485.flush();
  if (PIN_DE_RE >= 0) digitalWrite(PIN_DE_RE, LOW);

  const size_t esperado = 5 + 2 * cantidad;
  uint8_t resp[5 + 2 * 8];
  size_t largo = 0;
  unsigned long inicio = millis();
  while (largo < esperado && millis() - inicio < 300) {
    if (RS485.available()) {
      resp[largo++] = RS485.read();
    }
  }

  if (largo < esperado) return false;
  if (resp[0] != direccion || resp[1] != 0x03 || resp[2] != 2 * cantidad) return false;
  uint16_t crcResp = resp[esperado - 2] | (resp[esperado - 1] << 8);
  if (crcResp != crcModbus(resp, esperado - 2)) return false;

  for (uint8_t i = 0; i < cantidad; i++) {
    salida[i] = (resp[3 + 2 * i] << 8) | resp[4 + 2 * i];
  }
  return true;
}

// Convierte el valor crudo en pH probando las escalas habituales (x100 y x10).
bool interpretarPh(uint16_t crudo, float& ph, float& divisor) {
  if (crudo / 100.0 >= 1.0 && crudo / 100.0 <= 14.0) { ph = crudo / 100.0; divisor = 100.0; return true; }
  if (crudo / 10.0  >= 1.0 && crudo / 10.0  <= 14.0) { ph = crudo / 10.0;  divisor = 10.0;  return true; }
  return false;
}

void detectarSensorPh() {
#if PH_CONFIG_MANUAL
  phBaudios = PH_BAUDIOS; phRegistro = PH_REGISTRO; phDivisor = PH_DIVISOR;
  RS485.begin(phBaudios);
  phListo = true;
  Serial.println("pH: usando la configuración manual.");
  return;
#endif
  Serial.println("pH: buscando el sensor RS485...");
  for (long baudios : PH_BAUDIOS_PROBAR) {
    RS485.begin(baudios);
    delay(100);
    for (uint16_t registro : PH_REGISTROS_PROBAR) {
      uint16_t valor;
      if (!leerRegistros(PH_DIRECCION, registro, 1, &valor)) continue;

      Serial.print("  responde a ");
      Serial.print(baudios);
      Serial.print(" baudios, registro 0x");
      Serial.print(registro, HEX);
      Serial.print(" = ");
      Serial.println(valor);

      float ph, divisor;
      if (interpretarPh(valor, ph, divisor)) {
        phBaudios = baudios; phRegistro = registro; phDivisor = divisor;
        phListo = true;
        Serial.print("pH: sensor encontrado. Para fijarlo usa PH_BAUDIOS = ");
        Serial.print(phBaudios);
        Serial.print(", PH_REGISTRO = 0x");
        Serial.print(phRegistro, HEX);
        Serial.print(", PH_DIVISOR = ");
        Serial.println(phDivisor, 0);
        return;
      }
    }
  }
  Serial.println("pH: el sensor no responde. Revisa: 12 V en el sensor, cables A/B (prueba");
  Serial.println("    intercambiarlos), TXD->D0 y RXD->D1 (prueba intercambiarlos) y GND común.");
}

// Devuelve true y el pH si la lectura fue correcta.
bool leerPh(float& ph) {
  if (!phListo) return false;
  uint16_t valor;
  if (!leerRegistros(PH_DIRECCION, phRegistro, 1, &valor)) {
    if (++phFallos >= 3) {             // tras 3 fallos seguidos, vuelve a detectar
      phListo = false;
      phFallos = 0;
    }
    return false;
  }
  phFallos = 0;
  ph = valor / phDivisor;
  return ph >= 0.0 && ph <= 14.0;
}

// ======================= Detección de sensores =======================

// Estado anterior de cada sensor, para avisar en el Monitor Serie solo cuando cambia.
int estadoSuelo = -1;
int estadoDht   = -1;
int estadoPh    = -1;

void avisarCambio(int& anterior, bool ahora, const char* nombre) {
  if (anterior == (ahora ? 1 : 0)) return;
  anterior = ahora ? 1 : 0;
  Serial.print(nombre);
  Serial.println(ahora ? ": CONECTADO" : ": no conectado (no se envía)");
}

// Carga el pin al nivel indicado, lo suelta y lo lee tras la espera.
int leerTrasCargar(int nivel) {
  pinMode(PIN_SUELO, OUTPUT);
  digitalWrite(PIN_SUELO, nivel);
  delay(2);
  pinMode(PIN_SUELO, INPUT);
  delay(SUELO_ESPERA_MS);
  return analogRead(PIN_SUELO);
}

bool sueloConectado() {
  int trasBajo = leerTrasCargar(LOW);
  int trasAlto = leerTrasCargar(HIGH);
  pinMode(PIN_SUELO, INPUT);
  delay(SUELO_ESPERA_MS);               // deja que el sensor vuelva a su valor
  Serial.print("prueba suelo: tras 0V=");
  Serial.print(trasBajo);
  Serial.print(" tras 5V=");
  Serial.println(trasAlto);
  return abs(trasAlto - trasBajo) < SUELO_UMBRAL_SUELTO;
}

// =============================== WiFi ================================

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Conectando a WiFi \\"");
  Serial.print(WIFI_SSID);
  Serial.print("\\"");
#if USAR_IP_FIJA
  WiFi.config(ipFija, gateway, gateway, mascara);
#endif
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\\nNo se pudo conectar al WiFi. Se reintenta en el próximo envío.");
    return;
  }

  // El UNO R4 tarda un momento en recibir su IP después de conectarse.
  while (WiFi.localIP() == IPAddress(0, 0, 0, 0) && millis() - inicio < 25000) {
    delay(200);
  }
  Serial.print("\\nConectado. IP del Arduino: ");
  Serial.println(WiFi.localIP());
}

// ============================== Envío ================================

void enviarLectura() {
  // --- Leer sensores ---
  // Humedad del suelo: solo si se detecta el sensor en el pin.
  float humedadSuelo = NAN;
  bool haySuelo = sueloConectado();
  avisarCambio(estadoSuelo, haySuelo, "Sensor de humedad del suelo");
  if (haySuelo) {
    int crudoSuelo = analogRead(PIN_SUELO);
    humedadSuelo = map(crudoSuelo, SUELO_SECO, SUELO_MOJADO, 0, 1000) / 10.0;
    humedadSuelo = constrain(humedadSuelo, 0.0, 100.0);
    Serial.print("suelo crudo: ");
    Serial.println(crudoSuelo);
  }

  // DHT11: si no responde (o da 0 % de humedad, que es una lectura fallida)
  // se considera no conectado.
  float temperatura = dht.readTemperature();
  float humedadAire = dht.readHumidity();
  bool hayDht = !isnan(temperatura) && !isnan(humedadAire) && humedadAire > 0;
  avisarCambio(estadoDht, hayDht, "Sensor DHT11");
  if (!hayDht) {
    temperatura = NAN;
    humedadAire = NAN;
  }

  // pH RS485: si no respondía, se busca de nuevo cada minuto (la búsqueda
  // tarda unos segundos y no se repite en cada envío).
  float ph = NAN;
  static int ciclosSinPh = 0;
  if (!phListo && ++ciclosSinPh >= 6) {
    ciclosSinPh = 0;
    detectarSensorPh();
  }
  float lecturaPh;
  if (leerPh(lecturaPh)) ph = lecturaPh;
  avisarCambio(estadoPh, !isnan(ph), "Sensor de pH");

  // --- Armar el JSON ---
  // Un dato que no se pudo leer no se envía: el servidor lo guarda como
  // "sin dato" en lugar de un valor falso que dañaría los promedios.
  JsonDocument doc;  // ArduinoJson 7
  doc["arduino_id"] = ARDUINO_ID;
  if (!isnan(humedadSuelo)) doc["humedad_suelo"] = humedadSuelo;
  if (!isnan(ph))          doc["ph"] = ph;
  if (!isnan(temperatura)) doc["temperatura"] = temperatura;
  if (!isnan(humedadAire)) doc["humedad_aire"] = humedadAire;

  String payload;
  serializeJson(doc, payload);

  // --- Enviar POST ---
  cliente.beginRequest();
  cliente.post(RUTA);
  cliente.sendHeader("Content-Type", "application/json");
  cliente.sendHeader("Content-Length", payload.length());
  cliente.sendHeader("X-Arduino-Key", ARDUINO_CLAVE);
  cliente.beginBody();
  cliente.print(payload);
  cliente.endRequest();

  int estado = cliente.responseStatusCode();
  String respuesta = cliente.responseBody();
  cliente.stop();

  Serial.print("Enviado: ");
  Serial.println(payload);
  Serial.print("Respuesta (");
  Serial.print(estado);
  Serial.print("): ");
  Serial.println(respuesta);

  if (estado == 201) {
    Serial.println("OK: lectura guardada.");
  } else if (estado == 403) {
    Serial.println("ERROR: ID o clave incorrectos. Copia de nuevo el código desde la página.");
  } else if (estado == 400) {
    Serial.println("ERROR: algún valor está fuera de rango. Revisa los sensores.");
  } else if (estado == 429) {
    Serial.println("AVISO: demasiados envíos seguidos. Aumenta INTERVALO_MS.");
  } else if (estado < 0) {
    Serial.println("ERROR: no se pudo llegar al servidor. Revisa la IP, que Django corra con 0.0.0.0 y el firewall de Windows.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  dht.begin();
  delay(2000);   // el DHT11 necesita ~2 s tras encender; antes da lecturas basura
  if (PIN_DE_RE >= 0) {
    pinMode(PIN_DE_RE, OUTPUT);
    digitalWrite(PIN_DE_RE, LOW);
  }
  detectarSensorPh();
  cliente.setHttpResponseTimeout(8000);
  conectarWiFi();
}

void loop() {
  static unsigned long ultimo = 0;
  if (millis() - ultimo >= INTERVALO_MS || ultimo == 0) {
    ultimo = millis();
    conectarWiFi();  // se reconecta solo si se cayó la red
    if (WiFi.status() == WL_CONNECTED) {
      enviarLectura();
    }
  }
}
`;
}
