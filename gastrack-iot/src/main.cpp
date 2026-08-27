
// Arquivo main.cpp - Template básico Arduino
#include <Arduino.h>

// Configurações de pinos
const int LED_PIN = 2;

void setup() {
	Serial.begin(115200);
	pinMode(LED_PIN, OUTPUT);
	Serial.println("Iniciando...");
}

void loop() {
	// Exemplo: piscar LED integrado
	digitalWrite(LED_PIN, HIGH);
	delay(500);
	digitalWrite(LED_PIN, LOW);
	delay(500);
}

