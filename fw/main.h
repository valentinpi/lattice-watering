/******************/
/*  Node Firmware */
/******************/

#pragma once

#include <inttypes.h>
#include <stdio.h>

#include <nanocbor/nanocbor.h>
#include <net/coap.h>
#include <net/credman.h>
#include <net/gcoap.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/netreg.h>
#include <net/gnrc/nettype.h>
#include <net/netstats.h>
#include <net/sock/dtls.h>
#include <periph/adc.h>
#include <periph/gpio.h>
#include <periph/wdt.h>
#include <sched.h>
#include <shell.h>

#include "psk_key.h"

#define MSG_QUEUE_SIZE 16
#define PREFIX "[LWFW] "

msg_t msg_queue[MSG_QUEUE_SIZE];

const gpio_t PUMP_PA13 = GPIO_PIN(0, 13); // Controls the IN1 input pin of the motor board.
const gpio_t PUMP_PA28 = GPIO_PIN(0, 28); // Controls the EEP sleep mode pin of the motor board.
mutex_t pump_mutex = {0};

const adc_t SOIL_PIN = ADC_LINE(1);
const adc_res_t SOIL_RES = ADC_RES_12BIT;
mutex_t soil_mutex = {0};

gnrc_netif_t *netif_ieee802154 = NULL;
ipv6_addr_t host_ip = {0};
sock_udp_ep_t host_ep = {0};

uint8_t wdt_thread_stack[THREAD_STACKSIZE_SMALL];

const uint32_t DATA_INTERVAL = 5;
uint8_t data_thread_stack[THREAD_STACKSIZE_LARGE];
