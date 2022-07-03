/******************/
/*  Node Firmware */
/******************/

#include "main.h"

#include "cred.h"

void pump_init(void) {
    gpio_init(PUMP_PA13, GPIO_OUT);
    gpio_init(PUMP_PA28, GPIO_OUT);
}

void pump_toggle(void) {
    mutex_lock(&pump_mutex);
    gpio_toggle(PUMP_PA28);
    gpio_toggle(PUMP_PA13);
    pump_activated = !pump_activated;
    mutex_unlock(&pump_mutex);
}

int pump_toggle_command(int argc, char **argv) {
    (void)argc;
    (void)argv;

    pump_toggle();

    return 0;
}

static const adc_t SOIL_PIN = ADC_LINE(1);
static const adc_res_t RES = ADC_RES_12BIT;
static const int32_t DRY_VALUE = 2920;
static const int32_t WET_VALUE = 1400;

void soil_init(void) { adc_init(SOIL_PIN); }

uint8_t soil_read(void) {
    // TODO: Fix the values.
    int32_t moisture_value = adc_sample(SOIL_PIN, RES);
    int32_t moisture_percentage = (moisture_value - DRY_VALUE) * 100 / (WET_VALUE - DRY_VALUE);
    printf("%" PRId32 " ", moisture_value);
    printf("%d\n", (uint8_t)moisture_percentage);
    return (uint8_t)moisture_percentage;
}

void net_init(void) {
    netif_ieee802154 = gnrc_netif_iter(NULL); // Note that we included `gnrc_netif_single`
    assert(netif_ieee802154->device_type == NETDEV_TYPE_IEEE802154);
    printf(PREFIX "IEEE802154 interface found\n");
    ipv6_addr_from_str(&host_ip, HOST_IP_ADDR); // Note that via RPL, the node gets added a global address automatically
    memcpy(host_ep.addr.ipv6, host_ip.u8, 16);
    host_ep.family = AF_INET6;
    host_ep.netif = netif_ieee802154->pid;
    /* host_ep.port = CONFIG_GCOAPS_PORT; */
    host_ep.port = CONFIG_GCOAP_PORT;
}

void cred_init(void) {
    credman_credential_t cred = {.tag = 1};
    credman_load_private_ecc_key(&cred_private_der, cred_private_der_len, &cred);
    ecdsa_public_key_t pub = {};
    credman_load_public_key(&cred_public_der, cred_public_der_len, &pub);
    cred.params.ecdsa.public_key = pub;
    credman_add(&cred);

    sock_dtls_t *sock = gcoap_get_sock_dtls();
    sock_dtls_add_credential(sock, 1);
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

void *data_thread(void *arg) {
    (void)arg;

    uint8_t buf[CONFIG_GCOAP_PDU_BUF_SIZE];
    memset(buf, 0, CONFIG_GCOAP_PDU_BUF_SIZE);

    // Put packet metadata
    coap_pkt_t pdu = {};
    gcoap_req_init(&pdu, buf, CONFIG_GCOAP_PDU_BUF_SIZE, COAP_POST, "/data");
    coap_opt_add_format(&pdu, COAP_FORMAT_CBOR);
    coap_hdr_set_type(pdu.hdr, COAP_TYPE_NON);
    ssize_t meta_len = coap_opt_finish(&pdu, COAP_OPT_FINISH_PAYLOAD);
    while (true) {
        mutex_lock(&pump_mutex);

        // Obtain information
        uint8_t humidity = soil_read();
        netstats_t stats = netif_ieee802154->ipv6.stats;

        // Write data
        nanocbor_encoder_t enc = {};
        nanocbor_encoder_init(&enc, pdu.payload, 28);
        nanocbor_fmt_uint(&enc, humidity);
        nanocbor_fmt_bool(&enc, pump_activated);
        ipv6_addr_t ip = {};
        gnrc_netif_ipv6_addrs_get(netif_ieee802154, &ip, 1);
        for (size_t i = 0; i < 16; i++) {
            nanocbor_fmt_uint(&enc, ip.u8[i]);
        }
        nanocbor_fmt_uint(&enc, stats.rx_bytes);
        nanocbor_fmt_uint(&enc, stats.rx_count);
        nanocbor_fmt_uint(&enc, stats.tx_bytes);
        nanocbor_fmt_uint(&enc, stats.tx_unicast_count);
        nanocbor_fmt_uint(&enc, stats.tx_mcast_count);
        nanocbor_fmt_uint(&enc, stats.tx_success);
        nanocbor_fmt_uint(&enc, stats.tx_failed);
        size_t payload_len = nanocbor_encoded_len(&enc);

        // Post data
        gcoap_req_send(buf, meta_len + payload_len, &host_ep, NULL, NULL);

        mutex_unlock(&pump_mutex);
        memset(pdu.payload, 0, payload_len);
        ztimer_sleep(ZTIMER_SEC, DATA_INTERVAL);
    }

    return NULL;
}

ssize_t pump_handler(coap_pkt_t *pkt, uint8_t *buf, size_t len, void *context) {
    (void)pkt;
    (void)buf;
    (void)len;
    (void)context;

    pump_toggle();

    return 0;
}

int main(void) {
    /* Init */
    msg_init_queue(msg_queue, MSG_QUEUE_SIZE);
    pump_init();
    soil_init();
    net_init();
    cred_init();

    /* WDT */
    thread_create((char *)wdt_thread_stack, THREAD_STACKSIZE_TINY, THREAD_PRIORITY_MAIN - 1, 0, wdt_thread, NULL,
                  "wdt");

    /* Data */
    thread_create((char *)data_thread_stack, THREAD_STACKSIZE_LARGE, THREAD_PRIORITY_MAIN - 1, 0, data_thread, NULL,
                  "data");

    coap_resource_t res = {.methods = COAP_POST, .handler = pump_handler, .path = "/"};
    gcoap_listener_t listener = {.resources = &res, .resources_len = sizeof(res)};
    gcoap_register_listener(&listener);

    /* Debug Shell */
    const shell_command_t commands[] = {{"pump_toggle", "Toggle the pump", pump_toggle_command}, {NULL, NULL, NULL}};
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(commands, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
