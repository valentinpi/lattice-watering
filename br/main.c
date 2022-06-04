/***************************/
/*  Border Router Firmware */
/***************************/

#include <inttypes.h>
#include <net/gnrc/icmpv6.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/ndp.h>
#include <net/gnrc/rpl.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>
#include <ztimer.h>

#define MSG_QUEUE_SIZE 16
#define PREFIX "[LWBR] "

static msg_t msg_queue[MSG_QUEUE_SIZE];
static gnrc_netif_t *netif_ethernet = NULL;
static gnrc_netif_t *netif_ieee802154 = NULL;

void netif_init(void) {
    while (netif_ethernet == NULL || netif_ieee802154 == NULL) {
        gnrc_netif_t *netif = gnrc_netif_iter(NULL);
        while (netif != NULL) {
            netif_ethernet =
                (netif_ethernet == NULL && netif->device_type == NETDEV_TYPE_ETHERNET) ? netif : netif_ethernet;
            netif_ieee802154 =
                (netif_ieee802154 == NULL && netif->device_type == NETDEV_TYPE_IEEE802154) ? netif : netif_ieee802154;
            netif = gnrc_netif_iter(netif);
        }
        printf(PREFIX "Searching for the Ethernet and IEEE802154 interfaces...\n");
        ztimer_sleep(ZTIMER_MSEC, 1);
    }
    printf(PREFIX "Ethernet and IEEE802154 interfaces found\n");

    ipv6_addr_t ethernet_ip = {}, ieee802154_ip = {};
    ipv6_addr_from_str(&ethernet_ip, BR_ETHERNET_IP_ADDR);
    gnrc_netif_ipv6_addr_add(netif_ethernet, &ethernet_ip, 64, 0);
    ipv6_addr_from_str(&ieee802154_ip, BR_IEEE802154_IP_ADDR);
    gnrc_netif_ipv6_addr_add(netif_ieee802154, &ieee802154_ip, 64, 0);

    ipv6_addr_t host_ip = {};
    ipv6_addr_from_str(&host_ip, HOST_IP_ADDR);
    gnrc_ipv6_nib_ft_add(NULL, 0, &host_ip, netif_ethernet->pid, 0);

    gnrc_rpl_init(netif_ieee802154->pid);
    gnrc_rpl_root_init(0, &ieee802154_ip, true, true);
}

int main(void) {
    msg_init_queue(msg_queue, MSG_QUEUE_SIZE);
    netif_init();

    /* Debug Shell */
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}

/* Old code

    // coap_opt_add_block2 gcoap_resp_init(&pdu, CONFIG_GCOAP_PDU_BUF_SIZE, , COAP_CODE_CONTENT),

    const char *payload = "pump_toggle";
    nanocbor_encoder_t enc;
    uint8_t buf[32];
    memset(buf, 0, 32);
    memcpy(buf, MAGIC_STR, 4);
    nanocbor_encoder_init(&enc, &buf[4], 28);
    nanocbor_put_bstr(&enc, (uint8_t *)payload, sizeof(payload));

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
    if (memcmp(data, MAGIC_STR, 4) != 0) {
        gnrc_pktbuf_release(pkt);
        continue;
    }
    const uint8_t *cbor_data = &data[4];
    size_t cbor_data_len = data_len - 4;

    uint8_t decoded[28];
    size_t decoded_len = 28;
    nanocbor_value_t value;
    memset(&value, 0, sizeof(value));
    nanocbor_decoder_init(&value, (uint8_t *)&decoded, decoded_len);
    int err = nanocbor_get_bstr(&value, &cbor_data, &cbor_data_len);

    gnrc_pktbuf_release(pkt);
    pkt = NULL;

    if (err != NANOCBOR_OK) {
        continue;
    }

    printf(PREFIX "pump_toggle\n");

    // Payload
    const char *payload = PREFIX "pump_toggle";
    nanocbor_encoder_t enc;
    uint8_t buf[32];
    memset(buf, 0, 32);
    memcpy(buf, MAGIC_STR, 4);
    nanocbor_encoder_init(&enc, &buf[4], 28);
    nanocbor_put_bstr(&enc, (uint8_t *)payload, sizeof(payload));
    pkt = gnrc_pktbuf_add(pkt, buf, nanocbor_encoded_len(&enc), GNRC_NETTYPE_UNDEF);
}
*/

/*
while (1) {
    msg_t msg;
    msg_receive(&msg);
    printf(PREFIX "Message received!\n");
}
*/
