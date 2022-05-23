/*************************************************************************************************************/
/*  This firmware bundles a firmware for a board that is connected with a host PC serving a frontend along a */
/*  conventional connection and the firmware that utilizes its sensors to water the plants.                  */
/*  To switch between the firmwares, utilize the SERVER flag. E.g. by using make -DSERVER.                   */
/*************************************************************************************************************/

#include <hdc1000.h>
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

#define PREFIX "[LWFW] "

// Controls the IN1 input pin of the motor board.
static const gpio_t PUMP_PA13 = GPIO_PIN(0, 13);
// Controls the EEP sleep mode pin of the motor board.
static const gpio_t PUMP_PA28 = GPIO_PIN(0, 28);

void pump_setup(void) {
    gpio_init(PUMP_PA13, GPIO_OUT);
    gpio_init(PUMP_PA28, GPIO_OUT);
}

void pump_toggle(void) {
    gpio_toggle(PUMP_PA28);
    gpio_toggle(PUMP_PA13);
}

#define SERVER

int main(void) {
#ifdef SERVER
    /* Networking Code */
    /*
    const char *HOST_STR = "2003:00ec:cfff:28ad:52a7:2bff:fede:c75e";
    const uint16_t HOST_PORT = 8000;
    ipv6_addr_t host;
    ipv6_addr_from_str(&host, HOST_STR);

    // Payload
    const char *payload = PREFIX "Hello from our firmware!\n";
    gnrc_pktsnip_t *pkt = gnrc_pktbuf_add(NULL, PREFIX "Hi!\n", strlen(payload), GNRC_NETTYPE_UNDEF);
    // UDP
    pkt = gnrc_udp_hdr_build(pkt, HOST_PORT, HOST_PORT);
    // IPv6
    pkt = gnrc_ipv6_hdr_build(pkt, NULL, &host);
    // TODO: 6LoWPAN
    // netif
    // Choose the first network interface, should be the 802.15.4 one.
    gnrc_netif_t *netif = gnrc_netif_iter(NULL);
    // gnrc_pktsnip_t *pkt_netif = gnrc_netif_hdr_build(NULL, 0, NULL, 0);
    //((gnrc_netif_hdr_t *)pkt_netif->data)->if_pid = netif->pid;
    // LL_PREPEND(pkt, pkt_netif);
    //  Send
    // int err = gnrc_netapi_dispatch_send(GNRC_NETTYPE_UDP, GNRC_NETREG_DEMUX_CTX_ALL, pkt);
    int err = gnrc_netif_send(netif, pkt);
    printf("%d\n", err);
    */
#else
    /* Board initialization */
    pump_setup();
#endif

    /* Debug Shell */
    uint8_t *shell_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
