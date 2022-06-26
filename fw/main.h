/******************/
/*  Node Firmware */
/******************/

#pragma once

#include <inttypes.h>
#include <nanocbor/nanocbor.h>
#include <net/coap.h>
#include <net/credman.h>
#include <net/gcoap.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/netreg.h>
#include <net/gnrc/nettype.h>
#include <net/netstats.h>
//#include <net/sock/dtls.h>
#include <periph/adc.h>
#include <periph/gpio.h>
#include <periph/wdt.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>

#define MSG_QUEUE_SIZE 16
#define PREFIX "[LWFW] "

msg_t msg_queue[MSG_QUEUE_SIZE];

const gpio_t PUMP_PA13 = GPIO_PIN(0, 13);  // Controls the IN1 input pin of the motor board.
const gpio_t PUMP_PA28 = GPIO_PIN(0, 28);  // Controls the EEP sleep mode pin of the motor board.
bool pump_activated = false;
mutex_t pump_mutex = {};

gnrc_netif_t *netif_ieee802154 = NULL;
ipv6_addr_t host_ip = {};
sock_udp_ep_t host_ep = {};

uint8_t wdt_thread_stack[THREAD_STACKSIZE_DEFAULT];

const uint32_t DATA_INTERVAL = 5;
uint8_t data_thread_stack[THREAD_STACKSIZE_LARGE];
