/*************************************************************************************************************/
/*  This firmware bundles a firmware for a board that is connected with a host PC serving a frontend along a */
/*  conventional connection and the firmware that utilizes its sensors to water the plants.                  */
/*  To switch between the firmwares, utilize the SERVER flag. E.g. by using make -DSERVER.                   */
/*************************************************************************************************************/

#include <inttypes.h>
#include <led.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/nettype.h>
#include <net/gnrc/sixlowpan.h>
#include <net/gnrc/udp.h>
#include <periph/gpio.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>
#include <ztimer.h>

#define PREFIX "[LWBR] "

int main(void) {
    // Collect network interfaces
    gnrc_netif_t *netif_ethernet = NULL;
    gnrc_netif_t *netif_ieee802154 = NULL;
    while (netif_ethernet == NULL || netif_ieee802154 == NULL) {
        gnrc_netif_t *netif = gnrc_netif_iter(NULL);
        while (netif != NULL) {
            netif_ethernet =
                (netif_ethernet == NULL && netif->device_type == NETDEV_TYPE_ETHERNET) ? netif : netif_ethernet;
            netif_ieee802154 =
                (netif_ieee802154 == NULL && netif->device_type == NETDEV_TYPE_IEEE802154) ? netif : netif_ieee802154;
            netif = gnrc_netif_iter(netif);
        }
        ztimer_sleep(ZTIMER_SEC, 1);
    }
    printf(PREFIX "Ethernet and IEEE802154 interfaces found\n");

    const char *HOST_STR = "fe80::89:5cff:fee5:3d10";
    // const uint16_t HOST_PORT = 8000;
    ipv6_addr_t host;
    ipv6_addr_from_str(&host, HOST_STR);

    gnrc_pktsnip_t *pkt = NULL;
    // Payload
    // const char *payload = PREFIX "Hello from our firmware!\n";
    // pkt = gnrc_pktbuf_add(pkt, PREFIX "Hi!\n", strlen(payload), GNRC_NETTYPE_UNDEF);
    //  UDP
    //  pkt = gnrc_udp_hdr_build(pkt, HOST_PORT, HOST_PORT);

    //  IPv6
    ipv6_addr_t client;
    gnrc_netif_ipv6_addrs_get(netif_ethernet, &client, sizeof(ipv6_addr_t));
    pkt = gnrc_ipv6_hdr_build(pkt, &client, &host);
    // Local link label
    ipv6_hdr_set_tc(pkt->data, 0x20);
    ipv6_hdr_print(pkt->data);

    // netif
    gnrc_pktsnip_t *tmp = pkt;
    uint8_t host_addr[6];
    uint8_t client_addr[6];
    gnrc_netif_addr_from_str("02:89:5c:e5:3d:10", host_addr);
    gnrc_netif_addr_from_str("DE:7D:20:37:DB:1D", client_addr);
    pkt = gnrc_netif_hdr_build(client_addr, 6, host_addr, 6);
    gnrc_netif_hdr_set_netif((gnrc_netif_hdr_t *)pkt->data, netif_ethernet);
    // gnrc_netif_hdr_set_timestamp()
    gnrc_netif_hdr_print(pkt->data);
    pkt->next = tmp;

    // Send
    // int err = gnrc_netapi_dispatch_send(GNRC_NETTYPE_UDP, GNRC_NETREG_DEMUX_CTX_ALL, pkt);
    // int err = gnrc_netif_send(netif_ethernet, pkt);
    // printf(PREFIX "%d\n", err);
    printf("HERE\n");
    gnrc_sixlowpan_iphc_send(pkt, NULL, 0);
    printf("HERE\n");
    // int err = gnrc_netif_send(netif_ethernet, pkt);
    // printf(PREFIX "%d\n", err);
    gnrc_sixlowpan_dispatch_send(pkt, NULL, 0);
    printf("HERE\n");

    // Setup a border router using ETHOS (Ethernet over Serial, the Data Link Layer) and UHCP (Instead of expensive DHCP
    // for IP configuration)

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
    uint8_t *shell_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
