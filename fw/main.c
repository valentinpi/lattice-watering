#include <hdc1000.h>
#include <inttypes.h>
#include <led.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/nettype.h>
#include <net/gnrc/sixlowpan.h>
#include <net/gnrc/udp.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>

#define PREFIX "[LWFW] "

int main(void) {
    /* HDC1000 Initialization Code */
    /*
    const hdc1000_params_t hdc1000_params = {// Only one device
                                             .addr = 64,
                                             // Only one bus
                                             .i2c = 0,
                                             // In microseconds
                                             .renew_interval = CONFIG_HDC1000_CONVERSION_TIME,
                                             .res = HDC1000_14BIT};

    hdc1000_t hdc1000;
    int res = hdc1000_init(&hdc1000, &hdc1000_p arams);
    if (res == HDC1000_OK) {
        printf(PREFIX "HDC1000 configured\n");
    }
    int16_t temp = 0, hum = 0;
    hdc1000_read(&hdc1000, &temp, &hum);
    printf(PREFIX "temperature: %" PRId16 "°C, humidity: %" PRId16 "\n", temp / 100, hum / 100);
    */

    /* Networking Code */
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

    // Debug shell
    uint8_t *shell_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
