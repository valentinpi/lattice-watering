/******************/
/*  Node Firmware */
/******************/

#include <inttypes.h>
#include <nanocbor/nanocbor.h>
#include <net/coap.h>
#include <net/credman.h>
#include <net/gcoap.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/netreg.h>
#include <net/gnrc/nettype.h>
#include <net/sock/dtls.h>
#include <periph/gpio.h>
#include <periph/wdt.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>

#define MSG_QUEUE_SIZE 16
#define PREFIX "[LWFW] "
#define DATA_INTERVAL 5  // In seconds

msg_t msg_queue[MSG_QUEUE_SIZE];

const gpio_t PUMP_PA13 = GPIO_PIN(0, 13);  // Controls the IN1 input pin of the motor board.
const gpio_t PUMP_PA28 = GPIO_PIN(0, 28);  // Controls the EEP sleep mode pin of the motor board.
bool pump_activated = false;

gnrc_netif_t *netif_ieee802154 = NULL;
ipv6_addr_t host_ip = {};

uint8_t wdt_thread_stack[THREAD_STACKSIZE_DEFAULT];
uint8_t data_thread_stack[THREAD_STACKSIZE_LARGE];

const uint8_t private[] = {
    0x30, 0x81, 0xdc, 0x02, 0x01, 0x01, 0x04, 0x42, 0x01, 0x76, 0x8c, 0xdf, 0x89, 0x1f, 0x69, 0x1a, 0x28, 0x32, 0x36,
    0x1a, 0x57, 0xb6, 0xcf, 0x7e, 0xe2, 0xf2, 0x00, 0xce, 0x71, 0x5e, 0x49, 0xbf, 0x98, 0xac, 0x5d, 0x7e, 0x75, 0x3d,
    0x8f, 0x4e, 0x1f, 0xf7, 0x33, 0xbb, 0xe3, 0x4f, 0x3f, 0xcd, 0x02, 0x86, 0x22, 0x86, 0x69, 0xd6, 0x86, 0xad, 0x85,
    0x50, 0x68, 0x48, 0xe8, 0xee, 0x42, 0x12, 0x87, 0x4e, 0xc4, 0xab, 0x67, 0x0d, 0x35, 0x7d, 0x05, 0x10, 0xa0, 0x07,
    0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23, 0xa1, 0x81, 0x89, 0x03, 0x81, 0x86, 0x00, 0x04, 0x01, 0x43, 0x6b, 0xd2,
    0x68, 0xef, 0xe6, 0xb5, 0x92, 0xae, 0x2a, 0x0a, 0xb4, 0x09, 0xc0, 0x08, 0x6a, 0x78, 0xc6, 0xb6, 0x26, 0xa3, 0xe4,
    0xd9, 0xc3, 0x74, 0xa8, 0xe2, 0x15, 0x49, 0xd9, 0x48, 0xb4, 0x6a, 0x53, 0x8e, 0x61, 0x2b, 0x73, 0x08, 0x93, 0x51,
    0x5e, 0x70, 0xea, 0x38, 0xe1, 0xc2, 0x86, 0x42, 0x51, 0x83, 0x11, 0xf9, 0xf8, 0xd2, 0xac, 0x43, 0x40, 0x30, 0x28,
    0x34, 0x8e, 0x60, 0x68, 0x10, 0x01, 0x7b, 0x18, 0x1f, 0x2b, 0xa6, 0xcb, 0x52, 0x09, 0xea, 0x04, 0xd0, 0xaa, 0xac,
    0xd0, 0x3f, 0x40, 0xbe, 0x05, 0x87, 0x55, 0x59, 0xd3, 0xc8, 0x41, 0x14, 0xd4, 0xc3, 0x56, 0x05, 0x11, 0x0f, 0xdd,
    0x09, 0x06, 0xca, 0x27, 0xba, 0x9b, 0x03, 0x17, 0x0e, 0xc2, 0xdf, 0xa3, 0x9b, 0x6b, 0x99, 0x45, 0xeb, 0xad, 0xd6,
    0x58, 0x7c, 0xef, 0x6c, 0x57, 0x6b, 0xb8, 0x96, 0x99, 0x27, 0x3f, 0x42, 0xd1, 0x73};
const size_t private_len = 223;
const uint8_t public[] = {
    0x30, 0x81, 0x9b, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x05, 0x2b, 0x81,
    0x04, 0x00, 0x23, 0x03, 0x81, 0x86, 0x00, 0x04, 0x01, 0x43, 0x6b, 0xd2, 0x68, 0xef, 0xe6, 0xb5, 0x92, 0xae,
    0x2a, 0x0a, 0xb4, 0x09, 0xc0, 0x08, 0x6a, 0x78, 0xc6, 0xb6, 0x26, 0xa3, 0xe4, 0xd9, 0xc3, 0x74, 0xa8, 0xe2,
    0x15, 0x49, 0xd9, 0x48, 0xb4, 0x6a, 0x53, 0x8e, 0x61, 0x2b, 0x73, 0x08, 0x93, 0x51, 0x5e, 0x70, 0xea, 0x38,
    0xe1, 0xc2, 0x86, 0x42, 0x51, 0x83, 0x11, 0xf9, 0xf8, 0xd2, 0xac, 0x43, 0x40, 0x30, 0x28, 0x34, 0x8e, 0x60,
    0x68, 0x10, 0x01, 0x7b, 0x18, 0x1f, 0x2b, 0xa6, 0xcb, 0x52, 0x09, 0xea, 0x04, 0xd0, 0xaa, 0xac, 0xd0, 0x3f,
    0x40, 0xbe, 0x05, 0x87, 0x55, 0x59, 0xd3, 0xc8, 0x41, 0x14, 0xd4, 0xc3, 0x56, 0x05, 0x11, 0x0f, 0xdd, 0x09,
    0x06, 0xca, 0x27, 0xba, 0x9b, 0x03, 0x17, 0x0e, 0xc2, 0xdf, 0xa3, 0x9b, 0x6b, 0x99, 0x45, 0xeb, 0xad, 0xd6,
    0x58, 0x7c, 0xef, 0x6c, 0x57, 0x6b, 0xb8, 0x96, 0x99, 0x27, 0x3f, 0x42, 0xd1, 0x73};
const size_t public_len = 158;
