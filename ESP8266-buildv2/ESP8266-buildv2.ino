#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>
#include <LittleFS.h>
// #include <EEPROM.h>

// int eepromAddress = 0;
const char* AP_SSID = "ESP8266";     
const char* AP_PWD = "123456789"; 
ESP8266WebServer serverSTA(80);
ESP8266WebServer serverAP(80);
WebSocketsServer webSocket = WebSocketsServer(81);

String STA_SSID;
String STA_PWD;

String wifiStatus = "Not Connected";
String localIP = "";

String wifiNames;

void setup() {
  Serial.begin(9600);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PWD);

  // EEPROM.begin(512);
  // readCredentials();

  if (STA_SSID != "" && STA_PWD != "") {
    WiFi.begin(STA_SSID, STA_PWD);
  }

  loadFiles(serverAP);

  serverAP.begin();
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  wifiNames = getScanResult();
}

void loadFiles(ESP8266WebServer &server){
  if (!LittleFS.begin()) {
    Serial.println("An Error has occurred while mounting LittleFS");
    return;
  }

  server.on("/", HTTP_GET, [&server]() {
    File file = LittleFS.open("/index.html", "r");
    server.streamFile(file, "text/html");
    file.close();
  });

  server.on("/styles.css", HTTP_GET, [&server]() {
    File file = LittleFS.open("/styles.css", "r");
    server.streamFile(file, "text/css");
    file.close();
  });

  server.on("/script.js", HTTP_GET, [&server]() {
    File file = LittleFS.open("/script.js", "r");
    server.streamFile(file, "application/javascript");
    file.close();
  });

  server.on("/chart.umd.js", HTTP_GET, [&server]() {
      File file = LittleFS.open("/chart.umd.js", "r");
      server.streamFile(file, "application/javascript");
      file.close();
  });
}

void loop() {
  serverAP.handleClient();
  webSocket.loop();
  if(WiFi.status() == WL_CONNECTED)
  {
    wifiStatus = "Connected to " + STA_SSID;
    localIP = "LocalIP: " + WiFi.localIP().toString() + "; Gateway IP: " + WiFi.gatewayIP().toString() + "; DNS IP: " + WiFi.dnsIP().toString();
    serverSTA.handleClient();
  }
  while (Serial.available()) {
    String data = Serial.readStringUntil('\n');
    // String json = "{\"data\":\"" + data + "\",\"SSIDs\":\"" + wifiNames + "\"}";
    String json = "{\"data\":\"" + data + "\",\"SSIDs\":\"" + wifiNames + "\",\"wifistatus\":\"" + wifiStatus + "\",\"IP\":\"" + localIP + "\"}";
    
    webSocket.broadcastTXT(json.c_str());
  }
}
          
          
String getScanResult()
{
  int numSsid = WiFi.scanNetworks();
  String names = "";
  for (int i = 0; i < numSsid; i++)
  {
    names += WiFi.SSID(i).c_str();
    names += ",";
  }
  names.remove(names.length() - 1, 1);
  return names;
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  String socketType;
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connection from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      break;
    }
    case WStype_TEXT:
      Serial.printf("[%u] Text: %s\n", num, payload);
      socketType = strtok((char*)payload, ",");
      if(socketType == "REFRESH"){
        wifiNames = getScanResult();
      } else {
        STA_SSID = strtok(NULL, ",");
        STA_PWD = strtok(NULL, ",");
        WiFi.begin(STA_SSID, STA_PWD);
        // writeCredentials();
        loadFiles(serverSTA);
        serverSTA.begin();
      }
      break;
    case WStype_BIN:
      Serial.printf("[%u] Binary length: %u\n", num, length);
      break;
  }
}

// void readCredentials() {
//   EEPROM.get(eepromAddress, STA_SSID);
//   eepromAddress += sizeof(STA_SSID);
//   EEPROM.get(eepromAddress, STA_PWD);
//   eepromAddress += sizeof(STA_PWD);
// }

// void writeCredentials() {
//   EEPROM.put(eepromAddress, STA_SSID);
//   eepromAddress += sizeof(STA_SSID);
//   EEPROM.put(eepromAddress, STA_PWD);
//   EEPROM.commit();
// }