/***************************/
/*  Border Router Firmware */
/***************************/

#include <inttypes.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/rpl.h>
#include <periph/wdt.h>
#include <shell.h>
#include <ztimer.h>

#define MSG_QUEUE_SIZE 16
#define PREFIX "[LWBR] "

msg_t msg_queue[MSG_QUEUE_SIZE];
gnrc_netif_t *netif_ethernet = NULL;
gnrc_netif_t *netif_ieee802154 = NULL;

uint8_t wdt_thread_stack[THREAD_STACKSIZE_IDLE];

void net_init(void) {
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

void *wdt_thread(void *arg) {
    (void)arg;

    wdt_setup_reboot(0, 10e3);
    wdt_start();
    while (1) {
        ztimer_sleep(ZTIMER_SEC, 5);
        wdt_kick();
    }
}

int main(void) {
    /* Init */
    msg_init_queue(msg_queue, MSG_QUEUE_SIZE);
    net_init();

    /* WDT */
    thread_create((char *)wdt_thread_stack, THREAD_STACKSIZE_IDLE, THREAD_PRIORITY_MAIN - 1, 0, wdt_thread, NULL,
                  "wdt");

    /* Debug Shell */
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
