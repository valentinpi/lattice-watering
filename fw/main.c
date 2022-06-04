/******************/
/*  Node Firmware */
/******************/

#include <inttypes.h>
#include <nanocbor/nanocbor.h>
#include <net/coap.h>
#include <net/gcoap.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/netreg.h>
#include <net/gnrc/nettype.h>
#include <periph/gpio.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>

#define MSG_QUEUE_SIZE 16
#define PREFIX "[LWFW] "

static msg_t msg_queue[MSG_QUEUE_SIZE];
static const gpio_t PUMP_PA13 = GPIO_PIN(0, 13);  // Controls the IN1 input pin of the motor board.
static const gpio_t PUMP_PA28 = GPIO_PIN(0, 28);  // Controls the EEP sleep mode pin of the motor board.
static bool pump_activated = false;
static gnrc_netif_t *netif_ieee802154 = NULL;

// static const char MAGIC_STR[4] = "CBOR";

void pump_init(void) {
    gpio_init(PUMP_PA13, GPIO_OUT);
    gpio_init(PUMP_PA28, GPIO_OUT);
}

void pump_toggle(void) {
    gpio_toggle(PUMP_PA28);
    gpio_toggle(PUMP_PA13);
    pump_activated = !pump_activated;
}

int pump_toggle_command(int argc, char **argv) {
    (void)argc;
    (void)argv;

    pump_toggle();

    return 0;
}

void netif_init(void) {
    netif_ieee802154 = gnrc_netif_iter(NULL);  // Note that we included `gnrc_netif_single`
    assert(netif_ieee802154->device_type == NETDEV_TYPE_IEEE802154);
    printf(PREFIX "IEEE802154 interface found\n");
    // Note that via RPL, the node gets added a global address automatically
}

int main(void) {
    /* Board initialization */
    msg_init_queue(msg_queue, MSG_QUEUE_SIZE);
    pump_init();
    netif_init();

    {
        ipv6_addr_t host_ip = {};
        ipv6_addr_from_str(&host_ip, HOST_IP_ADDR);
        sock_udp_ep_t host_ep = {.family = AF_INET6, .netif = netif_ieee802154->pid, .port = COAP_PORT};
        memcpy(host_ep.addr.ipv6, host_ip.u8, 16);

        coap_pkt_t pdu;
        uint8_t buf[CONFIG_GCOAP_PDU_BUF_SIZE];
        gcoap_req_init(&pdu, buf, CONFIG_GCOAP_PDU_BUF_SIZE, COAP_CODE_EMPTY, NULL);
        coap_opt_finish(&pdu, 0);
        gcoap_request(&pdu, buf, CONFIG_GCOAP_PDU_BUF_SIZE, COAP_GET, "/");
        gcoap_req_send(buf, CONFIG_GCOAP_PDU_BUF_SIZE, &host_ep, NULL, NULL);
    }

    /* Debug Shell */
    const shell_command_t commands[] = {{"pump_toggle", "Toggle the pump", pump_toggle_command}, {NULL, NULL, NULL}};
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(commands, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}

/* Old code
msg_t msg_queue[MSG_QUEUE_SIZE];
memset(msg_queue, 0, MSG_QUEUE_SIZE * sizeof(msg_t));
msg_init_queue(msg_queue, MSG_QUEUE_SIZE);

gnrc_netreg_entry_t server = GNRC_NETREG_ENTRY_INIT_PID(GNRC_NETREG_DEMUX_CTX_ALL, thread_getpid());
gnrc_netreg_register(GNRC_NETTYPE_IPV6, &server);

while (true) {
    msg_t msg;
    msg_receive(&msg);

    gnrc_pktsnip_t *pkt = msg.content.ptr;

    const uint8_t *data = pkt->next->next->data;
    size_t data_len = pkt->next->next->size;

    uint8_t decoded[32];
    size_t decoded_len = 32;
    nanocbor_value_t value;
    memset(&value, 0, sizeof(value));
    nanocbor_decoder_init(&value, (uint8_t *)&decoded, decoded_len);
    if (data_len > decoded_len) {
        gnrc_pktbuf_release(pkt);
        break;
    }

    int err = nanocbor_get_bstr(&value, &data, &data_len);

    gnrc_pktbuf_release(pkt);
    pkt = NULL;

    if (err != NANOCBOR_OK) {
        continue;
    }

    printf(PREFIX "pump_toggle\n");
}
*/
