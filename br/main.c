/***************************/
/*  Border Router Firmware */
/***************************/

#include <inttypes.h>
#include <led.h>
#include <nanocbor/nanocbor.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/nettype.h>
#include <net/gnrc/sixlowpan.h>
#include <net/gnrc/udp.h>
#include <periph/gpio.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>
#include <ztimer.h>

#define MSG_QUEUE_SIZE 8
#define PREFIX "[LWBR] "

#define NODE_IP_STR "fe80::204:2519:1801:8633"
#define HOST_IP_STR "fe80::89:5cff:fee5:3d10"
#define NODE_L2_STR "00:04:25:19:18:01:86:33"
#define HOST_L2_STR "02:89:5c:e5:3d:10"

// static const char MAGIC_STR[4] = "CBOR";

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
        ztimer_sleep(ZTIMER_MSEC, 1);
    }
    printf(PREFIX "Ethernet and IEEE802154 interfaces found\n");

    ipv6_addr_t unicast_ip;
    memset(unicast_ip.u64, 0, 8);
    ipv6_addr_from_str(&unicast_ip, "fc00::1");
    gnrc_netif_ipv6_addr_add(netif_ethernet, &unicast_ip, 121, 0);
    gnrc_netif_ipv6_addr_add(netif_ieee802154, &unicast_ip, 121, 0);
    printf(PREFIX "Added unicast address fc00::1 to both interfaces\n");
}

int main(void) {
    init_netif();

    while (true) {
        size_t n = 0;
        void *state = NULL;
        gnrc_ipv6_nib_nc_t nce;
        memset(&nce, 0, sizeof(gnrc_ipv6_nib_nc_t));
        while (gnrc_ipv6_nib_nc_iter(0, &state, &nce)) {
            n += 1;
        }
        printf("%d\n", n);
        ztimer_sleep(ZTIMER_SEC, 1);
    }

    /*
    ipv6_addr_t node_ip, br_ip, host_ip;
    memset(node_ip.u64, 0, 8);
    memset(br_ip.u64, 0, 8);
    memset(host_ip.u64, 0, 8);
    ipv6_addr_from_str(&node_ip, NODE_IP_STR);
    ipv6_addr_from_str(&host_ip, HOST_IP_STR);

    uint8_t node_l2[GNRC_NETIF_L2ADDR_MAXLEN], *br_l2, host_l2[GNRC_NETIF_L2ADDR_MAXLEN];
    size_t node_l2_len = 0, br_l2_len = 0, host_l2_len = 0;
    memset(node_l2, 0, GNRC_NETIF_L2ADDR_MAXLEN);
    memset(host_l2, 0, GNRC_NETIF_L2ADDR_MAXLEN);
    node_l2_len = gnrc_netif_addr_from_str(NODE_L2_STR, node_l2);  // TODO: Obtain MAC automatically
    host_l2_len = gnrc_netif_addr_from_str(HOST_L2_STR, host_l2);

    {
        gnrc_pktsnip_t *pkt = NULL;

        // Payload
        const char *payload = PREFIX "pump_toggle";
        nanocbor_encoder_t enc;
        uint8_t buf[32];
        memset(buf, 0, 32);
        nanocbor_encoder_init(&enc, buf, 32);
        nanocbor_put_bstr(&enc, (uint8_t *)payload, sizeof(payload));
        pkt = gnrc_pktbuf_add(pkt, buf, nanocbor_encoded_len(&enc), GNRC_NETTYPE_UNDEF);

        // UDP
        pkt = gnrc_udp_hdr_build(pkt, 8000, 8000);
        ((udp_hdr_t *)pkt->data)->length = byteorder_htons(gnrc_pkt_len(pkt->next));

        // IPv6
        gnrc_netif_ipv6_addrs_get(netif_ethernet, &br_ip, sizeof(ipv6_addr_t));  // First address in list
        pkt = gnrc_ipv6_hdr_build(pkt, &br_ip, &host_ip);
        ipv6_hdr_set_tc(pkt->data, 0x20);  // Local link label

        // netif
        br_l2 = netif_ethernet->l2addr;
        br_l2_len = netif_ethernet->l2addr_len;
        gnrc_pktsnip_t *netif_hdr = gnrc_netif_hdr_build(br_l2, br_l2_len, host_l2, host_l2_len);
        gnrc_netif_hdr_set_netif((gnrc_netif_hdr_t *)netif_hdr->data, netif_ethernet);
        // gnrc_netif_hdr_set_timestamp()
        netif_hdr->next = pkt;
        pkt = netif_hdr;
        ((udp_hdr_t *)pkt->next->next->data)->checksum = byteorder_htons(gnrc_udp_calc_csum(pkt->next->next, pkt));

        // Send
        // int err = gnrc_netapi_dispatch_send(GNRC_NETTYPE_UDP, GNRC_NETREG_DEMUX_CTX_ALL, pkt);
        // int err = gnrc_netif_send(netif_ethernet, pkt);
        // printf(PREFIX "%d\n", err);
        // gnrc_sixlowpan_iphc_send(pkt, NULL, 0);
        // int err = gnrc_netif_send(netif_ethernet, pkt);
        // printf(PREFIX "%d\n", err);
        // gnrc_sixlowpan_dispatch_send(pkt, NULL, 0);
        gnrc_netif_send(netif_ethernet, pkt);
    }

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
    msg_t msg_queue[8];
    msg_init_queue(msg_queue, 8);
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
