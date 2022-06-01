/***************************/
/*  Border Router Firmware */
/***************************/

#include <inttypes.h>
#include <led.h>
#include <nanocbor/nanocbor.h>
#include <net/coap.h>
#include <net/gcoap.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/ndp.h>
#include <net/gnrc/nettype.h>
#include <net/gnrc/sixlowpan.h>
#include <net/gnrc/udp.h>
#include <net/sock/udp.h>
#include <periph/gpio.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>
#include <ztimer.h>

#define MSG_QUEUE_SIZE 8
#define PREFIX "[LWBR] "

// static const char MAGIC_STR[4] = "CBOR";

static msg_t msg_queue[MSG_QUEUE_SIZE];
static gnrc_netif_t *netif_ethernet = NULL;
static gnrc_netif_t *netif_ieee802154 = NULL;

void init_netif(void) {
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

    ipv6_addr_t unicast_ip;
    memset(unicast_ip.u64, 0, 8);
#ifdef BR_IP_ADDR
    ipv6_addr_from_str(&unicast_ip, BR_IP_ADDR);
#else
    assert(false);
#endif
    gnrc_netif_ipv6_addr_add(netif_ethernet, &unicast_ip, 121, 0);
    gnrc_netif_ipv6_addr_add(netif_ieee802154, &unicast_ip, 121, 0);
    printf(PREFIX "Added unicast address fc00::1 to both interfaces\n");
}

int main(void) {
    msg_init_queue(msg_queue, 8);
    init_netif();

    ipv6_addr_t host_ip;
    memset(&host_ip, 0, sizeof(ipv6_addr_t));
#ifdef HOST_IP_ADDR
    ipv6_addr_from_str(&host_ip, HOST_IP_ADDR);
#else
    assert(false);
#endif

    // Send neighbor solicitation to host
    gnrc_ndp_nbr_sol_send(&host_ip, netif_ethernet, NULL, &host_ip, NULL);

    sock_udp_ep_t host_ep = {.family = AF_INET6, .netif = netif_ethernet->pid, .port = COAP_PORT};
    memcpy(host_ep.addr.ipv6, host_ip.u8, 16);

    coap_pkt_t pdu;
    uint8_t buf[CONFIG_GCOAP_PDU_BUF_SIZE];
    gcoap_req_init(&pdu, buf, CONFIG_GCOAP_PDU_BUF_SIZE, COAP_CODE_EMPTY, NULL);
    coap_opt_finish(&pdu, 0);
    gcoap_request(&pdu, buf, CONFIG_GCOAP_PDU_BUF_SIZE, COAP_GET, "/");
    gcoap_req_send(buf, CONFIG_GCOAP_PDU_BUF_SIZE, &host_ep, NULL, NULL);

    // gcoap_resp_init(&pdu, CONFIG_GCOAP_PDU_BUF_SIZE, , COAP_CODE_CONTENT),

    /*

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

        // IPv6
        gnrc_netif_ipv6_addrs_get(netif_ieee802154, &br_ip, sizeof(ipv6_addr_t));  // First address in list
        pkt = gnrc_ipv6_hdr_build(pkt, &br_ip, &node_ip);
        ipv6_hdr_set_tc(pkt->data, 0x20);  // Local link label

        // netif
        br_l2 = netif_ieee802154->l2addr;
        br_l2_len = netif_ieee802154->l2addr_len;
        gnrc_pktsnip_t *netif_hdr = gnrc_netif_hdr_build(br_l2, br_l2_len, node_l2, node_l2_len);
        gnrc_netif_hdr_set_netif((gnrc_netif_hdr_t *)netif_hdr->data, netif_ieee802154);
        // gnrc_netif_hdr_set_timestamp()
        netif_hdr->next = pkt;
        pkt = netif_hdr;

        // Send
        gnrc_netif_send(netif_ieee802154, pkt);
    }
    */

    /*     gnrc_ipv6_nib_init_iface(netif_ethernet);
        while (1) {
            void *state = NULL;
            gnrc_ipv6_nib_nc_t nce;
            gnrc_ipv6_nib_nc_iter(0, &state, &nce);
            size_t i = 0;
            while (state != NULL) {
                i += 1;
                gnrc_ipv6_nib_nc_iter(0, &state, &nce);
            }
            printf("%d neighbors\n", i);
            ztimer_sleep(ZTIMER_SEC, 1);
        } */

    /*
    while (1) {
        msg_t msg;
        msg_receive(&msg);
        printf(PREFIX "Message received!\n");
    }
    */

    /* Debug Shell */
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
